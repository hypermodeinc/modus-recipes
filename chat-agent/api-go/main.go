package main

import (
	"github.com/hypermodeinc/modus/sdk/go/pkg/agents"
)

type SearchResponse struct {
	Message          string `json:"message"`
	History          string `json:"history"`
	User_preferences string `json:"user_preferences"`
}

var session_ID = ""

func init() {
	agents.Register(&ChatAgent{})

}

// The following are regular Modus functions.

func CreateConversation() (id *string, err error) {
	// ChatAgent Name is "Chat-v1"
	// A Conversation is an instance of the ChatAgent.
	info, err := agents.Start("Chat-v1")
	if err != nil {
		return nil, err
	}

	return &info.Id, nil
}
func ContinueChat(id string, query string) (*string, error) {
	// Send a message to the agent in charge of the conversation.
	response, err := agents.SendMessage(id, "new_user_message", agents.WithData(query))
	if err != nil {
		return nil, err
	}

	return response, nil
}

type ChatResponse struct {
	Message string `json:"message"`
	History string `json:"history"`
}

func ChatHistory(id string) (*string, error) {
	// Send a message to the agent and get a response.
	// The agent will use the chat history to generate a response.
	// The response will be in the form of a JSON string.
	// The response will include the message, the chat history, and any user preferences.
	// The user preferences are optional and can be used to customize the response.
	return agents.SendMessage(id, "get_chat_history")
}

/*func SaveFact(id string, fact string, location string) (*string, error) {
	// Send a message to the agent to save a fact.
	return (save_fact(id, fact, location))
}
*/

func DeleteAgent(id string) (*string, error) {
	_, err := agents.Stop(id)
	if err != nil {
		return nil, err
	}
	return &id, nil
}
