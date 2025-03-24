package main

import (
	"encoding/json"
	"fmt"

	"github.com/hypermodeinc/modus/sdk/go/pkg/models/openai"
)

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ResponseWithLogs struct {
	Response    string   `json:"response"`
	Role        string   `json:"role"`
	Logs        []string `json:"logs"`
	ChatHistory string   `json:"chat_history"`
}

func llmWithTools(
	model *openai.ChatModel,
	tools []openai.Tool,
	systemPrompt string,
	question string,
	chatHistory string,
	responseFormat openai.ResponseFormat,
	toolCallback func(toolCall openai.ToolCall) string,
	limit int,
) ResponseWithLogs {

	var chatMessages []openai.RequestMessage
	if chatHistory != "" {
		err := json.Unmarshal([]byte(chatHistory), &chatMessages)
		if err != nil {
			fmt.Println("Error parsing chat history:", err)
		}
	}

	logs := []string{}
	var finalResponse *openai.CompletionMessage
	loops := 0

	chatMessages = append(chatMessages, openai.NewUserMessage(question))

	for loops < limit {
		message, _ := getLLMResponse(model, tools, systemPrompt, question, chatMessages, responseFormat)

		if len(message.ToolCalls) > 0 {
			chatMessages = append(chatMessages, message.ToAssistantMessage())
			for _, toolCall := range message.ToolCalls {
				logs = append(logs, fmt.Sprintf("Calling function: %s with %s", toolCall.Function.Name, toolCall.Function.Arguments))
				content := toolCallback(toolCall)
				fmt.Println("Tool response:", content)
				chatMessages = append(chatMessages, openai.NewToolMessage(content, toolCall.Id))
			}
		} else {
			chatMessages = append(chatMessages, message.ToAssistantMessage())
			finalResponse = &message
			break
		}
		loops++
	}

	chatHistoryJSON, _ := json.Marshal(chatMessages)

	return ResponseWithLogs{
		Response: func() string {
			if finalResponse != nil {
				return finalResponse.Content
			} else {
				return "no response"
			}
		}(),
		Role:        "assistant",
		ChatHistory: string(chatHistoryJSON),
		Logs:        logs,
	}
}

func getLLMResponse(
	model *openai.ChatModel,
	tools []openai.Tool,
	systemPrompt string,
	question string,
	chatMessages []openai.RequestMessage,
	responseFormat openai.ResponseFormat,
) (openai.CompletionMessage, error) {

	input, _ := model.CreateInput(
		openai.NewSystemMessage(systemPrompt),
	)

	input.Messages = append(input.Messages, chatMessages...)
	input.Messages = append(input.Messages, openai.NewUserMessage(question))

	input.ResponseFormat = responseFormat

	if len(tools) > 0 {
		input.Tools = tools
		input.ToolChoice = openai.ToolChoiceAuto
	}
	output, err := model.Invoke(input)
	if err != nil {
		return openai.CompletionMessage{}, err
	}

	return output.Choices[0].Message, nil
}

func main() {
	fmt.Println("Go implementation using Modus SDK")
}
