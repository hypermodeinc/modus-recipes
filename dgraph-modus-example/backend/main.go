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

func GetRelatedMovies(uid string) (string, error) {
	query := fmt.Sprintf(`
	{
		relatedMovies(func: uid(%q)) {
			genre {
				genreMovies as genre
			}
			starring {
				performance.actor {
					actorMovies as uid
				}
			}
		}

		genreMovies(func: uid(genreMovies), first: 4) {
			uid
			name@en
			initial_release_date
		}

		actorMovies(func: uid(actorMovies), first: 4) {
			uid
			name@en
			initial_release_date
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
		return "", fmt.Errorf("Error fetching data from Dgraph: %w", err)
	}

	return string(response.Body), nil
}
