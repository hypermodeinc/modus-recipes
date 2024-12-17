package main

import (
	"fmt"
	"github.com/hypermodeinc/modus/sdk/go/pkg/http"
)

func FetchMoviesAndActorsWithPagination(page int, search string) (string, error) {
	offset := page * 20

	query := fmt.Sprintf(`
	{
		movies(func: has(initial_release_date), first: 20, offset: %d) %s {
			uid
			name@en
			initial_release_date
			starring {
				name@en
			}
		}
	}`, offset, buildSearchFilter(search))

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

func buildSearchFilter(search string) string {
	if search == "" {
		return ""
	}
	return fmt.Sprintf(`@filter(anyofterms(name@en, "%s") OR anyofterms(starring.name@en, "%s"))`, search, search)
}
