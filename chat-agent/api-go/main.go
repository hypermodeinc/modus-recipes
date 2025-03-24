package main

import (
	"fmt"
	"time"

	"github.com/hypermodeinc/modus/sdk/go/pkg/models"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models/openai"
	"github.com/tidwall/gjson"
)

type SearchResponse struct {
	Message string `json:"message"`
	History string `json:"history"`
}

const MODEL_NAME = "text-generator"

func defaultPrompt() string {
	/*
	* Default prompt provides the global context of your chat.
	* one option is to save this global prompt in Dgraph and expose an admin function to update it.
	* This way you can update the global context without changing the code.
	* This example is using a hardcoded prompt.
	* The prompt provides the main goal for the chat and instruct the LLM to use the provided tools.
	* As an example of context data we also provide the current date in the prompt.
	 */
	isoTime := time.Now().UTC().Format(time.RFC3339)

	prompt := fmt.Sprintf(`Today is %s. 
    You are a helpful travel agent. Ask questions to the user until you obtain a booking intent and hotel criteria with enough information.
    A clear booking intent must contain the following information:
    - "city"
    - "number of people"
    - "date"
    - "duration in days"
    The hotel criteria may contain the following information:
    - "rating": OneStar, TwoStar, ThreeStar, FourStar, FiveStar
	- "facilities": wifi, parking, pool, gym, spa, ...

    If the intent is not clear, reply with your understanding of the user's intent and a the question to clarify the intent.

    An example of a clear intent is: "I would like to book a hotel with wifi in Valencia for 2 people next Monday for 3 days."
     or with a list of hotels.
    Ask one question at a time.
    Use the provided tools to help you with the conversation and list hotels matching the user criteria.
	`, isoTime)
	return prompt
}

func executeToolCall(tool_call openai.ToolCall) string {
	// Parse JSON into a map of strings
	params_map := make(map[string]string)
	gjson.Parse(tool_call.Function.Arguments).ForEach(func(key, value gjson.Result) bool {
		params_map[key.String()] = value.String()
		return true
	})
	fmt.Println("Tool call:", tool_call.Function.Name, params_map)
	if tool_call.Function.Name == "search_hotels" {
		return searchHotels(tool_call.Function.Arguments)
	} else if tool_call.Function.Name == "weather_forecast" {
		return weatherForecast(tool_call.Function.Arguments)
	}
	return ""
}
func searchHotels(arguments string) string {
	return "I found 3 hotels in Valencia matching your criteria: Hotel 1, Hotel 2, Hotel 3"
}
func weatherForecast(arguments string) string {
	return "The weather in Valencia on Monday will be sunny with a temperature of 25°C"
}
func chatTools() []openai.Tool {
	tools := []openai.Tool{
		openai.NewToolForFunction("search_hotels", "list of hotels matching the user criteria").
			WithParameter("city", "string", `city name where user wants to book a hotel`).
			WithParameter("number_of_people", "integer", `number of people for the booking`).
			WithParameter("checking_date", "string", `date for the booking`).
			WithParameter("duration_in_days", "integer", `duration of the booking in days`).
			WithParameter("rating", "string", `rating of the hotel`).
			WithParameter("facilities", "string", `comma separated list of facilities expected`),
		openai.NewToolForFunction("weather_forecast", "Provide weather forecast for a city and date").
			WithParameter("city", "string", `city`).
			WithParameter("date", "string", `date`),
	}
	return tools
}

func Chat(query string, chatHistory string) (SearchResponse, error) {

	model, _ := models.GetModel[openai.ChatModel](MODEL_NAME)

	loopLimit := 3 // Maximum number of loops

	llmResponse := llmWithTools(
		model,
		chatTools(),
		defaultPrompt(),
		query,
		chatHistory,
		openai.ResponseFormatText,
		executeToolCall,
		loopLimit,
	)

	response := SearchResponse{
		Message: llmResponse.Response,
		History: llmResponse.ChatHistory,
	}

	fmt.Println(llmResponse.Response)

	return response, nil
}
