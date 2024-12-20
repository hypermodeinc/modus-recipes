package main

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/hypermodeinc/modus/sdk/go/pkg/http"          // Modus HTTP library for making API requests
	"github.com/hypermodeinc/modus/sdk/go/pkg/models"        // Modus models library for AI models
	"github.com/hypermodeinc/modus/sdk/go/pkg/models/openai" // Modus OpenAI model integration
)

// MovieDetails represents the structure of a movie's details retrieved from Dgraph
type MovieDetails struct {
	Name string `json:"name@en"` // JSON tag maps Dgraph's "name@en" field
}

// FetchMoviesWithPaginationAndSearch fetches a paginated list of movies from Dgraph with optional search functionality
// This function showcases the power of Dgraph in efficiently handling graph-based queries and filtering
// through interconnected datasets, such as movies, genres, actors, and directors.
func FetchMoviesWithPaginationAndSearch(page int, search string) (string, error) {
	offset := (page - 1) * 10 // Calculate offset for pagination (10 movies per page)

	// Build the query dynamically with pagination, sorting, and optional search filtering
	query := fmt.Sprintf(`{
		movies(func: has(initial_release_date), first: 10, offset: %d, orderdesc: initial_release_date) %s {
			uid
			name@en
			initial_release_date
			genre {
				name@en
			}
			starring {
				performance.actor {
					name@en
				}
			}
			directed_by: director.film {
				name@en
			}
		}
	}`, offset, buildSearchFilter(search))
fmt.Println(query)
	return executeDgraphQuery(query)
}


func buildSearchFilter(search string) string {
	if search == "" {
		return ""
	}

	// Generate a Dgraph filter that matches the search term against relevant fields
	return fmt.Sprintf(`@filter(
		anyoftext(name@en, "%[1]s") OR
		anyoftext(genre.name@en, "%[1]s") OR
		anyoftext(starring.performance.actor.name@en, "%[1]s") OR
		anyoftext(directed_by.name@en, "%[1]s")
	)`, search)
}


// generateRecommendations interacts with Modus to generate AI-driven movie recommendations
// Modus simplifies integrating internal data with large language models (LLMs),
// allowing us to easily feed custom prompts and retrieve actionable insights tailored to our data.
func generateRecommendations(prompt string) (*string, error) {
	// Fetch the AI model (e.g., OpenAI's GPT model) from Modus. This is configured on our modus.json file.
	model, err := models.GetModel[openai.ChatModel]("text-generator")
	if err != nil {
		return nil, fmt.Errorf("error fetching model: %w", err)
	}

	// Create the input for the AI model using system and user messages
	input, err := model.CreateInput(
		openai.NewSystemMessage("You are a movie recommendation assistant. Provide concise suggestions."),
		openai.NewUserMessage(prompt),
	)
	if err != nil {
		return nil, fmt.Errorf("error creating model input: %w", err)
	}

	input.Temperature = 0.7

	output, err := model.Invoke(input)
	if err != nil {
		return nil, fmt.Errorf("error invoking model: %w", err)
	}

	outputStr := strings.TrimSpace(output.Choices[0].Message.Content)
	return &outputStr, nil
}

// FetchMovieDetailsAndRecommendations retrieves movie details from Dgraph and generates AI recommendations
// This function combines the power of Dgraph for querying interconnected datasets with Modus for generating AI-driven insights.
func FetchMovieDetailsAndRecommendations(uid string, searchQuery string) (string, error) {
	// Fetch movie details from Dgraph
	movieDetailsJSON, err := fetchMovieDetails(uid)
	if err != nil {
		return "", err
	}

	// Parse the movie name from the details
	movieName, err := parseMovieName(movieDetailsJSON)
	if err != nil {
		return "", err
	}

	// Generate a custom prompt using the movie name and user search query
	// Modus enables dynamic LLM interactions tailored to our internal data.
	prompt := generatePrompt(movieName, searchQuery)

	// Fetch AI-driven recommendations using the prompt
	recommendations, err := generateRecommendations(prompt)
	if err != nil {
		return "", fmt.Errorf("error generating recommendations: %w", err)
	}

	// Combine Dgraph's movie details with AI-generated recommendations into a single JSON response
	combinedResponse := fmt.Sprintf(`{
		"movieDetails": %q,
		"recommendations": %q
	}`, movieDetailsJSON, *recommendations)

	return combinedResponse, nil
}

// fetchMovieDetails retrieves detailed information about a specific movie by its UID from Dgraph
func fetchMovieDetails(uid string) (string, error) {
	query := fmt.Sprintf(`{
		movie(func: uid(%s)) {
			uid
			name@en
			initial_release_date
			genre {
				name@en
			}
			starring {
				performance.actor {
					name@en
				}
			}
			directed_by: director.film {
				name@en
			}
		}
	}`, uid)

	return executeDgraphQuery(query)
}

// parseMovieName extracts the movie name from the JSON response
func parseMovieName(movieDetailsJSON string) (string, error) {
	var parsedDetails struct {
		Data struct {
			Movie []MovieDetails `json:"movie"`
		} `json:"data"`
	}

	if err := json.Unmarshal([]byte(movieDetailsJSON), &parsedDetails); err != nil {
		return "", fmt.Errorf("error parsing movie details JSON: %w", err)
	}

	if len(parsedDetails.Data.Movie) == 0 || parsedDetails.Data.Movie[0].Name == "" {
		return "", fmt.Errorf("movie name not found in details")
	}

	return parsedDetails.Data.Movie[0].Name, nil
}

func generatePrompt(movieName string, searchQuery string) string {
	prompt := fmt.Sprintf("This movie is called '%s'.", movieName)
	if searchQuery != "" {
		prompt += fmt.Sprintf(" The user is interested in '%s'.", searchQuery)
	}
	prompt += " Recommend 5 similar movies in HTML format. For each recommendation, include the title, release year, genres, director, and a short description if possible. Use <li> or <h2> for organization. If you have no recommendations, just give 5 movies that are popular in the same genre."
	return prompt
}

// executeDgraphQuery performs the actual query against the Dgraph database
func executeDgraphQuery(query string) (string, error) {
	queryPayload := map[string]string{"query": query}

	options := &http.RequestOptions{
		Method: "POST",
		Body:   queryPayload,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}

	// Use Modus's HTTP client to send the query
	request := http.NewRequest("https://play.dgraph.io/query?respFormat=json", options)
	response, err := http.Fetch(request)
	if err != nil {
		fmt.Println("Error fetching data from Dgraph:", err)
		return "", err
	}

	return string(response.Body), nil
}
