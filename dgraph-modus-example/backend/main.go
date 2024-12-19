package main

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/hypermodeinc/modus/sdk/go/pkg/http"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models/openai"
)

type MovieDetails struct {
	Name string `json:"name@en"`
}

func FetchMoviesWithPaginationAndSearch(page int, search string) (string, error) {
	offset := (page - 1) * 10

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

	return executeDgraphQuery(query)
}

func buildSearchFilter(search string) string {
	if search == "" {
		return ""
	}

	return fmt.Sprintf(`@filter(
		anyoftext(name@en, "%[1]s") OR
		anyoftext(genre.name@en, "%[1]s") OR
		anyoftext(starring.performance.actor.name@en, "%[1]s") OR
		anyoftext(directed_by.name@en, "%[1]s")
	)`, search)
}

func generateRecommendations(prompt string) (*string, error) {
	model, err := models.GetModel[openai.ChatModel]("text-generator")
	if err != nil {
		return nil, fmt.Errorf("error fetching model: %w", err)
	}

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

func FetchMovieDetailsAndRecommendations(uid string, searchQuery string) (string, error) {
	movieDetailsJSON, err := fetchMovieDetails(uid)
	if err != nil {
		return "", err
	}

	movieName, err := parseMovieName(movieDetailsJSON)
	if err != nil {
		return "", err
	}

	prompt := generatePrompt(movieName, searchQuery)

	recommendations, err := generateRecommendations(prompt)
	if err != nil {
		return "", fmt.Errorf("error generating recommendations: %w", err)
	}

	combinedResponse := fmt.Sprintf(`{
		"movieDetails": %q,
		"recommendations": %q
	}`, movieDetailsJSON, *recommendations)

	return combinedResponse, nil
}

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
