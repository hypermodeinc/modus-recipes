package main

import (
	"fmt"
	"strings" 
	"github.com/hypermodeinc/modus/sdk/go/pkg/http"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models/openai"
)

// FetchMoviesWithPaginationAndSearch fetches movies with pagination and optional search
func FetchMoviesWithPaginationAndSearch(page int, search string) (string, error) {
	offset := (page - 1) * 10 // Calculate offset for pagination (10 movies per page)

	// Construct the Dgraph query
	query := fmt.Sprintf(`
	{
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

	return executeDgraphQuery(query)
}

// buildSearchFilter constructs the @filter condition for the query
func buildSearchFilter(search string) string {
	if search == "" {
		return "" // No filter if search is empty
	}

	// Use "anyoftext" for fuzzy search across multiple fields
	return fmt.Sprintf(`@filter(
		anyoftext(name@en, "%[1]s") OR
		anyoftext(genre.name@en, "%[1]s") OR
		anyoftext(starring.performance.actor.name@en, "%[1]s") OR
		anyoftext(directed_by.name@en, "%[1]s")
	)`, search)
}

// executeDgraphQuery sends the query to the Dgraph endpoint and returns the response
func executeDgraphQuery(query string) (string, error) {
	queryPayload := map[string]string{"query": query}

	options := &http.RequestOptions{
		Method: "POST",
		Body:   queryPayload,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}

	request := http.NewRequest("https://play.dgraph.io/query?respFormat=json", options)
	response, err := http.Fetch(request)
	if err != nil {
		fmt.Println("Error fetching data from Dgraph:", err)
		return "", err
	}

	return string(response.Body), nil
}

func FetchMovieById(uid string) (string, error) {
	query := fmt.Sprintf(`
	{
		movie(func: uid(%s)) {
			uid
			name@en
			initial_release_date
			genre {
				name@en
			}
			starring {
				performance.actor {
					uid
					name@en
				}
			}
		}
	}`, uid)

	return executeDgraphQuery(query)
}

func generateRecommendations(prompt string) (*string, error) {
	// Fetch the model configured in modus.json
	model, err := models.GetModel[openai.ChatModel]("text-generator")
	if err != nil {
		return nil, fmt.Errorf("error fetching model: %w", err)
	}

	// Create the input prompt for the model
	input, err := model.CreateInput(
		openai.NewSystemMessage("You are a movie recommendation assistant. Provide concise suggestions."),
		openai.NewUserMessage(prompt),
	)
	if err != nil {
		return nil, fmt.Errorf("error creating model input: %w", err)
	}

	// Set model parameters like temperature for creativity
	input.Temperature = 0.7

	// Invoke the model
	output, err := model.Invoke(input)
	if err != nil {
		return nil, fmt.Errorf("error invoking model: %w", err)
	}

	// Extract and return the output
	outputStr := strings.TrimSpace(output.Choices[0].Message.Content)
	return &outputStr, nil
}

// Example function to call GenerateRecommendations
func FetchRecommendations(movieName string, searchQuery string) {
	prompt := fmt.Sprintf("Based on the movie '%s' and the search query '%s', recommend 5 similar movies based on what the movie is about, the genre, and the director. Recommend movies that the user is most likely to enjoy.", movieName, searchQuery)

	// Generate recommendations
	recommendations, err := generateRecommendations(prompt)
	if err != nil {
		fmt.Println("Error generating recommendations:", err)
		return
	}

	return *recommendations, nil
}

