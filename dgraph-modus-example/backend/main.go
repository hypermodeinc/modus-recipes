package main

import (
	"fmt"
	"github.com/hypermodeinc/modus/sdk/go/pkg/http"
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