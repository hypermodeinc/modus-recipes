package main

import (
	"fmt"
	"strings"

	"github.com/hypermodeinc/modus/sdk/go/pkg/http"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models/openai"
	pg "github.com/hypermodeinc/modus/sdk/go/pkg/postgresql"
)

func GenerateText(prompt string) (*string, error) {

	// The imported ChatModel type follows the OpenAI Chat completion model input format.
	model, err := models.GetModel[openai.ChatModel]("text-generator")
	if err != nil {
		return nil, err
	}

	input, err := model.CreateInput(
		openai.NewSystemMessage("You are a helpful assistant. Try and be as concise as possible."),
		openai.NewUserMessage(prompt),
	)
	if err != nil {
		return nil, err
	}

	input.Temperature = 0.7

	output, err := model.Invoke(input)
	if err != nil {
		return nil, err
	}

	outputStr := strings.TrimSpace(output.Choices[0].Message.Content)
	return &outputStr, nil
}

type Quote struct {
	Quote  string `json:"q"`
	Author string `json:"a"`
}

func FetchQuote() (*Quote, error) {
	req := http.NewRequest("https://zenquotes.io/api/random")

	res, err := http.Fetch(req, nil)
	if err != nil {
		return nil, err
	}

	var quotes []Quote
	res.JSON(&quotes)

	if len(quotes) == 0 {
		return nil, fmt.Errorf("no quotes found")
	}

	return &quotes[0], nil
}

func FetchQuoteAndAuthorInfo() (quote *Quote, info *string, err error) {
	quote, err = FetchQuote()
	if err != nil {
		return nil, nil, err
	}

	info, err = GenerateText(fmt.Sprintf("Give me a information about %s, limit it to 1 sentence.", quote.Author))
	if err != nil {
		return nil, nil, err
	}

	return quote, info, nil
}

func FetchQuoteAddToDB() (uint, error) {
	quote, info, err := FetchQuoteAndAuthorInfo()
	if err != nil {
		return 0, err
	}

	rows, err := pg.Execute("postgres", "INSERT INTO quotes (quote, author, info) VALUES ($1, $2, $3)", quote.Quote, quote.Author, *info)
	if err != nil {
		return 0, err
	}

	return rows, nil
}

type DBQuote struct {
	Quote  string `json:"quote"`
	Author string `json:"author"`
	Info   string `json:"info"`
}

func FetchQuotesFromDB() ([]DBQuote, error) {
	rows, _, err := pg.Query[DBQuote]("postgres", "SELECT quote, author, info FROM quotes")
	if err != nil {
		return nil, err
	}

	return rows, nil
}
