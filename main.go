package main

import (
	"fmt"
	"strings"

	"github.com/hypermodeinc/modus/sdk/go/pkg/http"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models/openai"
	pg "github.com/hypermodeinc/modus/sdk/go/pkg/postgresql"
)

func SayHello(name *string) string {

	var s string
	if name == nil {
		s = "World"
	} else {
		s = *name
	}

	return fmt.Sprintf("Hello, %s!", s)
}

// In this example, we will generate text using the OpenAI Chat model.
// See https://platform.openai.com/docs/api-reference/chat/create for more details
// about the options available on the model, which you can set on the input object.

// This function generates some text based on the instruction and prompt provided.
func GenerateText(prompt string) (*string, error) {

	// The imported ChatModel type follows the OpenAI Chat completion model input format.
	model, err := models.GetModel[openai.ChatModel]("text-generator")
	if err != nil {
		return nil, err
	}

	// We'll start by creating an input object using the instruction and prompt provided.
	input, err := model.CreateInput(
		openai.NewSystemMessage("You are a helpful assistant. Try and be as concise as possible."),
		openai.NewUserMessage(prompt),
		// ... if we wanted to add more messages, we could do so here.
	)
	if err != nil {
		return nil, err
	}

	// This is one of many optional parameters available for the OpenAI Chat model.
	input.Temperature = 0.7

	// Here we invoke the model with the input we created.
	output, err := model.Invoke(input)
	if err != nil {
		return nil, err
	}

	// The output is also specific to the ChatModel interface.
	// Here we return the trimmed content of the first choice.
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

	info, err = GenerateText(fmt.Sprintf("Give me a little information about %s, limit it to 1 sentence.", quote.Author))
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
