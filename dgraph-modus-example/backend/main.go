package main

import (
	"fmt"
	"github.com/hypermodeinc/modus/sdk/go/pkg/http"
)

func FetchMoviesAndActorsWithPagination(page int, search string) (string, error) {
	offset := page * 10

	query := fmt.Sprintf(`
	{
		movies(func: has(initial_release_date), first: 10, offset: %d) %s {
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
	}`, offset, buildSearchFilter(search))

	return executeDgraphQuery(query)
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

func buildSearchFilter(search string) string {
	if search == "" {
		return ""
	}
	return fmt.Sprintf(`@filter(anyofterms(name@en, "%s") OR anyofterms(starring.name@en, "%s"))`, search, search)
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

	fmt.Println("Response:", string(response.Body))
	return string(response.Body), nil
}
