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
	toolCallback func(toolCall openai.ToolCall) (*string, error),
	limit int,
	historyLength int,
) ResponseWithLogs {
	var chatMessages []openai.RequestMessage
	if chatHistory != "" {
		var err error
		chatMessages, err = openai.ParseMessages([]byte(chatHistory))
		if err != nil {
			fmt.Println("Error parsing chat history:", err)
			chatMessages = []openai.RequestMessage{}
		}
	} else {
		chatMessages = []openai.RequestMessage{}
	}

	logs := []string{}
	var finalResponse *openai.CompletionMessage
	loops := 0

	for loops < limit {
		message, _ := getLLMResponse(model, tools, systemPrompt, question, chatMessages, responseFormat)
		if loops == 0 {
			chatMessages = append(chatMessages, openai.NewUserMessage(question))
		}
		if len(message.ToolCalls) > 0 {
			chatMessages = append(chatMessages, message.ToAssistantMessage())
			for _, toolCall := range message.ToolCalls {
				logs = append(logs, fmt.Sprintf("Calling function: %s with %s", toolCall.Function.Name, toolCall.Function.Arguments))
				content, err := toolCallback(toolCall)
				if err != nil {
					fmt.Printf("Error executing tool: %+v\n", err)
					msg := fmt.Sprintf("Error executing tool: %+v , explain to the user.", err)
					chatMessages = append(chatMessages, openai.NewToolMessage(&msg, toolCall.Id))
					break
				} else {
					fmt.Println("Tool response:", content)
					chatMessages = append(chatMessages, openai.NewToolMessage(content, toolCall.Id))
				}
			}
		} else {
			chatMessages = append(chatMessages, message.ToAssistantMessage())
			finalResponse = &message
			break
		}
		loops++
	}
	// limit the chat history
	if len(chatMessages) > historyLength {
		chatMessages = chatMessages[len(chatMessages)-historyLength:]
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
