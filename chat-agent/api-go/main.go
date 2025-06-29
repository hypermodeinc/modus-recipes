package main

import (
	"encoding/json"
	"fmt"

	"github.com/hypermodeinc/modus/sdk/go/pkg/agents"
)

type ChatRequest struct {
	Message string `json:"message"`
}

type ChatResponse struct {
	Items          string `json:"items"` // JSON string of items array
	ConversationId string `json:"conversationId"`
}

type HistoryResponse struct {
	Items string `json:"items"` // JSON string of items array
	Count int    `json:"count"`
}

func init() {
	agents.Register(&ChatAgent{})
}

// The following are regular Modus functions exposed via GraphQL

func CreateConversation() (string, error) {
	// ChatAgent Name is "KnowledgeAgent"
	// A Conversation is an instance of the ChatAgent.
	info, err := agents.Start("KnowledgeAgent")
	if err != nil {
		return "", err
	}

	return info.Id, nil
}

func ContinueChat(id string, query string) (ChatResponse, error) {
	// Send a message to the agent in charge of the conversation.
	request := ChatRequest{
		Message: query,
	}

	requestData, err := json.Marshal(request)
	if err != nil {
		return ChatResponse{}, fmt.Errorf("failed to marshal request: %v", err)
	}

	requestStr := string(requestData)
	response, err := agents.SendMessage(id, "chat", agents.WithData(requestStr))
	if err != nil {
		return ChatResponse{}, err
	}

	if response == nil {
		return ChatResponse{}, fmt.Errorf("no response received")
	}

	// Parse the response to extract items and conversation ID
	var agentResponse struct {
		Items          []interface{} `json:"items"`
		ConversationId string        `json:"conversationId"`
	}
	if err := json.Unmarshal([]byte(*response), &agentResponse); err != nil {
		return ChatResponse{}, fmt.Errorf("failed to unmarshal response: %v", err)
	}

	// Convert items array to JSON string for GraphQL
	itemsJson, err := json.Marshal(agentResponse.Items)
	if err != nil {
		return ChatResponse{}, fmt.Errorf("failed to marshal items: %v", err)
	}

	return ChatResponse{
		Items:          string(itemsJson),
		ConversationId: agentResponse.ConversationId,
	}, nil
}

func ChatHistory(id string) (HistoryResponse, error) {
	// Send a message to the agent and get response items.
	response, err := agents.SendMessage(id, "get_items")
	if err != nil {
		return HistoryResponse{}, err
	}

	if response == nil {
		return HistoryResponse{Items: "[]", Count: 0}, nil
	}

	// Parse the response to extract items and count
	var agentResponse struct {
		Items []interface{} `json:"items"`
		Count int           `json:"count"`
	}
	if err := json.Unmarshal([]byte(*response), &agentResponse); err != nil {
		return HistoryResponse{}, fmt.Errorf("failed to unmarshal items: %v", err)
	}

	// Convert items array to JSON string for GraphQL
	itemsJson, err := json.Marshal(agentResponse.Items)
	if err != nil {
		return HistoryResponse{}, fmt.Errorf("failed to marshal items: %v", err)
	}

	return HistoryResponse{
		Items: string(itemsJson),
		Count: agentResponse.Count,
	}, nil
}

func DeleteAgent(id string) (string, error) {
	_, err := agents.Stop(id)
	if err != nil {
		return "", err
	}
	return id, nil
}

func DeleteConversationHistory(id string) (bool, error) {
	_, err := agents.SendMessage(id, "clear_items")
	if err != nil {
		return false, err
	}
	return true, nil
}
