package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"github.com/hypermodeinc/modus/sdk/go/pkg/http"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models/openai"
)

type GitHubUser struct {
	Login     string `json:"login"`
	HTMLURL   string `json:"html_url"`
	Type      string `json:"type"`
	SiteAdmin bool   `json:"site_admin"`
}

type GitHubLabel struct {
	Name string `json:"name"`
}

type GitHubReactions struct {
	URL        string `json:"url"`
	TotalCount int    `json:"total_count"`
	PlusOne    int    `json:"+1"`
	MinusOne   int    `json:"-1"`
	Laugh      int    `json:"laugh"`
	Hooray     int    `json:"hooray"`
	Confused   int    `json:"confused"`
	Heart      int    `json:"heart"`
	Rocket     int    `json:"rocket"`
	Eyes       int    `json:"eyes"`
}

type GitHubIssue struct {
	Title       string         `json:"title"`
	Body        string         `json:"body"`
	State       string         `json:"state"`
	Number      int            `json:"number"`
	HTMLURL     string         `json:"html_url"`
	CreatedAt   string         `json:"created_at"`
	UpdatedAt   string         `json:"updated_at"`
	ClosedAt    string         `json:"closed_at"`
	User        GitHubUser     `json:"user"`
	Labels      []GitHubLabel  `json:"labels"`
	Comments    int            `json:"comments"`
	CommentsURL string         `json:"comments_url"`
	Reactions   GitHubReactions `json:"reactions"` 
}

type GitHubComment struct {
	User      GitHubUser `json:"user"` 
	Body      string     `json:"body"`
	CreatedAt string     `json:"created_at"`
	UpdatedAt string     `json:"updated_at"`
}

func postDiscussionToRepo(repo string, title string, body string, token string) error {
	// Extract owner and repository name
	parts := strings.Split(repo, "/")
	if len(parts) != 2 {
		return fmt.Errorf("invalid repository format: %s", repo)
	}
	owner, repoName := parts[0], parts[1]

	// Get the repository ID
	repoID, err := getRepositoryID(owner, repoName, token)
	if err != nil {
		return fmt.Errorf("error fetching repository ID: %w", err)
	}

	// Get the first available discussion category
	categoryID, err := getDiscussionCategoryID(repoID, token)
	if err != nil {
		return fmt.Errorf("error fetching discussion category ID: %w", err)
	}

	// GraphQL mutation to create a discussion
	createDiscussionMutation := `
	mutation($repoID: ID!, $categoryID: ID!, $title: String!, $body: String!) {
		createDiscussion(input: {repositoryId: $repoID, categoryId: $categoryID, title: $title, body: $body}) {
			discussion {
				url
			}
		}
	}`

	// Variables for the mutation
	variables := map[string]string{
		"repoID":     repoID,
		"categoryID": categoryID,
		"title":      title,
		"body":       body,
	}

	payload := map[string]interface{}{
		"query":     createDiscussionMutation,
		"variables": variables,
	}

	// Send the request
	options := &http.RequestOptions{
		Method: "POST",
		Headers: map[string]string{
			"Authorization": "Bearer " + token,
			"Content-Type":  "application/json",
		},
		Body: payload,
	}

	request := http.NewRequest("https://api.github.com/graphql", options)
	response, err := http.Fetch(request)
	if err != nil {
		return fmt.Errorf("error creating discussion: %w", err)
	}

	if response.Status != 200 {
		return fmt.Errorf("failed to create discussion, status: %d, body: %s", response.Status, string(response.Body))
	}

	fmt.Println("✅ Discussion created successfully.")
	return nil
}

// Fetch repository ID from GitHub GraphQL API
func getRepositoryID(owner string, repoName string, token string) (string, error) {
	query := `
	query($owner: String!, $name: String!) {
		repository(owner: $owner, name: $name) {
			id
		}
	}`

	variables := map[string]string{
		"owner": owner,
		"name":  repoName,
	}

	payload := map[string]interface{}{
		"query":     query,
		"variables": variables,
	}

	options := &http.RequestOptions{
		Method: "POST",
		Headers: map[string]string{
			"Authorization": "Bearer " + token,
			"Content-Type":  "application/json",
		},
		Body: payload,
	}

	request := http.NewRequest("https://api.github.com/graphql", options)
	response, err := http.Fetch(request)
	if err != nil {
		return "", fmt.Errorf("error fetching repository ID: %w", err)
	}

	var result struct {
		Data struct {
			Repository struct {
				ID string `json:"id"`
			} `json:"repository"`
		} `json:"data"`
	}

	if err := json.Unmarshal(response.Body, &result); err != nil {
		return "", fmt.Errorf("error parsing repository ID response: %w", err)
	}

	return result.Data.Repository.ID, nil
}

// Fetch the first available discussion category ID
func getDiscussionCategoryID(repoID string, token string) (string, error) {
	query := `
	query($repoID: ID!) {
		node(id: $repoID) {
			... on Repository {
				discussionCategories(first: 1) {
					nodes {
						id
					}
				}
			}
		}
	}`

	variables := map[string]string{
		"repoID": repoID,
	}

	payload := map[string]interface{}{
		"query":     query,
		"variables": variables,
	}

	options := &http.RequestOptions{
		Method: "POST",
		Headers: map[string]string{
			"Authorization": "Bearer " + token,
			"Content-Type":  "application/json",
		},
		Body: payload,
	}

	request := http.NewRequest("https://api.github.com/graphql", options)
	response, err := http.Fetch(request)
	if err != nil {
		return "", fmt.Errorf("error fetching discussion category ID: %w", err)
	}

	var result struct {
		Data struct {
			Node struct {
				DiscussionCategories struct {
					Nodes []struct {
						ID string `json:"id"`
					} `json:"nodes"`
				} `json:"discussionCategories"`
			} `json:"node"`
		} `json:"data"`
	}

	if err := json.Unmarshal(response.Body, &result); err != nil {
		return "", fmt.Errorf("error parsing discussion category ID response: %w", err)
	}

	// Return the first available category
	if len(result.Data.Node.DiscussionCategories.Nodes) > 0 {
		return result.Data.Node.DiscussionCategories.Nodes[0].ID, nil
	}

	return "", fmt.Errorf("no discussion categories found in repository")
}


func generateKBArticle(issue *GitHubIssue, comments []GitHubComment) (string, error) {
	prompt := fmt.Sprintf(`
		Generate a detailed markdown article givin a concise summary of the following GitHub issue. Include the problem, the solution (if on exists), and any other relevant details. Please mention the users involved and any significant involvement in the issue.
		
		### Issue Details:
		- **Title**: %s
		- **Description**: %s
		- **State**: %s
		- **Created by**: %s
		- **Created at**: %s
		- **Labels**: %v
		- **Reactions**: 👍 (%d), 👎 (%d), ❤️ (%d), 🎉 (%d), 🚀 (%d), 👀 (%d)

		### Comments:
		%s

		Generate the output in markdown format.
	`,
		issue.Title, issue.Body, issue.State, issue.User.Login, issue.CreatedAt,
		getLabelNames(issue.Labels),
		issue.Reactions.PlusOne, issue.Reactions.MinusOne, issue.Reactions.Heart,
		issue.Reactions.Hooray, issue.Reactions.Rocket, issue.Reactions.Eyes,
		formatComments(comments),
	)

	model, err := models.GetModel[openai.ChatModel]("generate-article")
	if err != nil {
		return "", fmt.Errorf("error fetching model: %w", err)
	}

	input, err := model.CreateInput(
		openai.NewSystemMessage("You are an assistant that generates markdown documentation."),
		openai.NewUserMessage(prompt),
	)
	if err != nil {
		return "", fmt.Errorf("error creating model input: %w", err)
	}

	input.Temperature = 0.7

	output, err := model.Invoke(input)
	if err != nil {
		return "", fmt.Errorf("error invoking model: %w", err)
	}

	return strings.TrimSpace(output.Choices[0].Message.Content), nil
}

func getLabelNames(labels []GitHubLabel) string {
	names := []string{}
	for _, label := range labels {
		names = append(names, label.Name)
	}
	return strings.Join(names, ", ")
}

func formatComments(comments []GitHubComment) string {
	formatted := []string{}
	for _, comment := range comments {
		formatted = append(formatted, fmt.Sprintf("- **%s** (%s): %s", comment.User.Login, comment.CreatedAt, comment.Body))
	}
	return strings.Join(formatted, "\n")
}

func fetchIssueDetails(repo string, issueNumber int) (*GitHubIssue, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/issues/%d", repo, issueNumber)

	options := &http.RequestOptions{
		Method: "GET",
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}

	request := http.NewRequest(url, options)
	response, err := http.Fetch(request)
	if err != nil {
		return nil, fmt.Errorf("error fetching issue details: %w", err)
	}

	if response.Status != 200 {
		fmt.Printf("Unexpected response status: %d\n", response.Status)
		fmt.Printf("Response body: %s\n", string(response.Body))
		return nil, fmt.Errorf("unexpected status code: %d", response.Status)
	}

	var issue GitHubIssue
	if err := json.Unmarshal(response.Body, &issue); err != nil {
		return nil, fmt.Errorf("error parsing issue details: %w", err)
	}

	return &issue, nil
}

func fetchIssueComments(commentsURL string) ([]GitHubComment, error) {
	options := &http.RequestOptions{
		Method: "GET",
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}

	request := http.NewRequest(commentsURL, options)
	response, err := http.Fetch(request)
	if err != nil {
		return nil, fmt.Errorf("error fetching issue comments: %w", err)
	}

	if response.Status != 200 {
		fmt.Printf("Unexpected response status: %d\n", response.Status)
		fmt.Printf("Response body: %s\n", string(response.Body))
		return nil, fmt.Errorf("unexpected status code: %d", response.Status)
	}

	var comments []GitHubComment
	if err := json.Unmarshal(response.Body, &comments); err != nil {
		return nil, fmt.Errorf("error parsing comments: %w", err)
	}

	return comments, nil
}

func IssueClosedHandler(repo string, issueNumber int, token string) {
	issue, err := fetchIssueDetails(repo, issueNumber)
	if err != nil {
		fmt.Printf("Error fetching issue details: %v\n", err)
		return
	}

	comments, err := fetchIssueComments(issue.CommentsURL)
	if err != nil {
		fmt.Printf("Error fetching issue comments: %v\n", err)
		return
	}

	kbArticle, err := generateKBArticle(issue, comments)
	if err != nil {
		fmt.Printf("Error generating KB article: %v\n", err)
		return
	}

	// Output the KB article
	fmt.Printf(kbArticle)


	// Post the KB article as a GitHub discussion
	err = postDiscussionToRepo(repo, fmt.Sprintf("Issue Summary: %s", issue.Title), kbArticle, token)
	if err != nil {
		fmt.Printf("❌ Error posting KB article as a discussion: %v\n", err)
		return
	}

    fmt.Println("KB article successfully posted as a comment.")
}
