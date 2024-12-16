package main

import (
	"fmt"
	"github.com/hypermodeinc/modus/sdk/go/pkg/http"
)

// FetchMoviesAndActors queries the Dgraph endpoint for movies and actors
func FetchMoviesAndActors() (string, error) {
	// Define the query payload as a Go map
	queryPayload := map[string]string{
		"query": `
		{
			movies(func: has(initial_release_date), first: 10) {
				uid
				name@en
				initial_release_date
				starring {
					name@en
				}
			}
		}`,
	}

	// Create the HTTP request options
	options := &http.RequestOptions{
		Method: "POST",
		Body:   queryPayload, // Directly pass the Go map as the body
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}

	// Create the HTTP request
	request := http.NewRequest("https://play.dgraph.io/query?respFormat=json", options)

	// Send the request using Modus fetch
	response, err := http.Fetch(request)
	if err != nil {
		fmt.Println("Error fetching data from Dgraph:", err)
		return "", err
	}
	
	fmt.Println("Response:", string(response.Body))

	// Return the raw response body as a string
	return string(response.Body), nil
}
