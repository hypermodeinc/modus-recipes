package main

import (
	"fmt"
	"strings" 
	"github.com/hypermodeinc/modus/sdk/go/pkg/http"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models/openai"
)

func FetchMoviesWithPaginationAndSearch(page int, search string) (string, error) {
	offset := (page - 1) * 10

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
                    name@en
                }
            }
            directed_by: director.film {
                name@en
            }
        }
    }`, uid)

    movieDetails, err := executeDgraphQuery(query)
    if err != nil {
        return "", fmt.Errorf("error fetching movie details: %w", err)
    }

	prompt := fmt.Sprintf(
		"Here is what we know about the movie: %s. Based on this information and the user search query '%s', recommend 5 similar movies. Format the output strictly as a JSON array of objects. Each object must have the following keys: 'name' (movie name as a string), 'release_date' (year as a number), 'genre' (array of strings), and 'director' (string). Do not include any text, explanation, or context outside of this JSON array.",
		movieDetails,
		searchQuery,
	)

    recommendations, err := generateRecommendations(prompt)

    if err != nil {
        return "", fmt.Errorf("error generating recommendations: %w", err)
    }

    combinedResponse := fmt.Sprintf(`{
        "movieDetails": %s,
        "recommendations": %q
    }`, movieDetails, *recommendations)
    return combinedResponse, nil
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