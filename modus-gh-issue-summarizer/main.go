package main

import (
	"fmt"
	"strings"

	"github.com/hypermodeinc/modus/sdk/go/pkg/console"
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
	Title       string          `json:"title"`
	Body        string          `json:"body"`
	State       string          `json:"state"`
	Number      int             `json:"number"`
	HTMLURL     string          `json:"html_url"`
	CreatedAt   string          `json:"created_at"`
	UpdatedAt   string          `json:"updated_at"`
	ClosedAt    string          `json:"closed_at"`
	User        GitHubUser      `json:"user"`
	Labels      []GitHubLabel   `json:"labels"`
	Comments    int             `json:"comments"`
	CommentsURL string          `json:"comments_url"`
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

	if !response.Ok() {
		return fmt.Errorf("failed to create discussion, status: %d, body: %s", response.Status, response.Text())
	}

	console.Info("✅ Discussion created successfully.")
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

	if err := response.JSON(&result); err != nil {
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

	if err := response.JSON(&result); err != nil {
		return "", fmt.Errorf("error parsing discussion category ID response: %w", err)
	}

	categories := result.Data.Node.DiscussionCategories.Nodes
	if len(categories) == 0 {
		return "", fmt.Errorf("no discussion categories found in repository")
	}

	// Return the ID of the first available category
	return categories[0].ID, nil
}

func generateKBArticle(issue *GitHubIssue, comments []GitHubComment) (string, error) {
	prompt := fmt.Sprintf(`
Generate a detailed markdown article given a concise summary of the following GitHub issue.
Include the problem, the solution (if one exists), and any other relevant details.
Please mention the users involved and any significant involvement in the issue.

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
	names := make([]string, len(labels))
	for i, label := range labels {
		names[i] = label.Name
	}
	return strings.Join(names, ", ")
}

func formatComments(comments []GitHubComment) string {
	buf := strings.Builder{}
	for _, comment := range comments {
		buf.WriteString(fmt.Sprintf("- **%s** (%s): %s\n", comment.User.Login, comment.CreatedAt, comment.Body))
	}
	return buf.String()
}

func fetchIssueDetails(repo string, issueNumber int, token string) (*GitHubIssue, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/issues/%d", repo, issueNumber)

	options := &http.RequestOptions{
		Method: "GET",
		Headers: map[string]string{
			"Authorization": "Bearer " + token,
			"Content-Type":  "application/json",
		},
	}

	request := http.NewRequest(url, options)
	response, err := http.Fetch(request)
	if err != nil {
		return nil, fmt.Errorf("error fetching issue details: %w", err)
	}

	if !response.Ok() {
		msg := fmt.Sprintf("Unexpected response status: %d\n", response.Status)
		msg += fmt.Sprintf("Response body:\n%s\n", response.Text())
		console.Debug(msg)
		return nil, fmt.Errorf("unexpected status code: %d", response.Status)
	}

	var issue GitHubIssue
	if err := response.JSON(&issue); err != nil {
		return nil, fmt.Errorf("error parsing issue details: %w", err)
	}

	return &issue, nil
}

func fetchIssueComments(commentsURL, token string) ([]GitHubComment, error) {
	options := &http.RequestOptions{
		Method: "GET",
		Headers: map[string]string{
			"Authorization": "Bearer " + token,
			"Content-Type":  "application/json",
		},
	}

	request := http.NewRequest(commentsURL, options)
	response, err := http.Fetch(request)
	if err != nil {
		return nil, fmt.Errorf("error fetching issue comments: %w", err)
	}

	if !response.Ok() {
		msg := fmt.Sprintf("Unexpected response status: %d\n", response.Status)
		msg += fmt.Sprintf("Response body:\n%s\n", response.Text())
		console.Debug(msg)
		return nil, fmt.Errorf("unexpected status code: %d", response.Status)
	}

	var comments []GitHubComment
	if err := response.JSON(&comments); err != nil {
		return nil, fmt.Errorf("error parsing comments: %w", err)
	}

	return comments, nil
}

func IssueClosedHandler(repo string, issueNumber int, token string) error {
	issue, err := fetchIssueDetails(repo, issueNumber, token)
	if err != nil {
		return fmt.Errorf("error fetching issue details: %w", err)
	}

	comments, err := fetchIssueComments(issue.CommentsURL, token)
	if err != nil {
		return fmt.Errorf("error fetching issue comments: %w", err)
	}

	kbArticle, err := generateKBArticle(issue, comments)
	if err != nil {
		return fmt.Errorf("error generating KB article: %w", err)
	}

	// Output the KB article
	console.Debug(kbArticle)

	// Post the KB article as a GitHub discussion
	err = postDiscussionToRepo(repo, fmt.Sprintf("Issue Summary: %s", issue.Title), kbArticle, token)
	if err != nil {
		return fmt.Errorf("error posting KB article as a discussion: %w", err)
	}

	console.Debug("KB article successfully posted as a discussion.")
	return nil
}
