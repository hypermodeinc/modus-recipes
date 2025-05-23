/*
 * This example of a Modus Agent
 */

package main

import (
	"fmt"

	"github.com/hypermodeinc/modus/sdk/go/pkg/agents"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models/openai"
)

const MAX_HISTORY = 3
const MODEL_NAME = "text-generator"

/*
 * Chat Agent maintain an history of the conversation and can save facts in memory.
 */
type ChatAgent struct {

	// All agents must embed the AgentBase struct.
	agents.AgentBase

	// Additional fields can be added to the agent to hold state.
	// This is state is only visible to the active instance of the agent.
	// In this case, we are just using a simple integer field to hold the count.
	chatHistory string
}

// Agents are identified by a name.
func (c *ChatAgent) Name() string {
	return "Chat-v1"
}

// The agent should be able to save its state and restore it later.
// This is used for persisting data across soft restarts of the agent,
// such as when updating the agent code, or when the agent is suspended and resumed.
// The GetState and SetState methods below are used for this purpose.

// This method should return the current state of the agent as a string.
// Any format is fine, but it should be consistent and easy to parse.
func (c *ChatAgent) GetState() *string {
	return &c.chatHistory
}

// This method should set the state of the agent from a string.
// The string should be in the same format as the one returned by GetState.
// Be sure to consider data compatibility when changing the format of the state.
func (c *ChatAgent) SetState(data *string) {
	if data == nil {
		return
	}
	c.chatHistory = *data
}

// When the agent is first started, this method is automatically called. Implementing it is optional.
// If you don't need to do anything special when the agent starts, then you can omit it.
// It can be used to initialize state, retrieve data, etc.
// This is a good place to set up any listeners or subscriptions.
func (c *ChatAgent) OnStart() error {
	fmt.Println("Counter agent started")
	return nil
}

// When the agent is suspended, this method is automatically called.  Implementing it is optional.
// func (c *ChatAgent) OnSuspend() error {}

// When the agent is restored, this method is automatically called.  Implementing it is optional.
// func (c *ChatAgent) OnTerminate() error {}

// This method is called when the agent receives a message.
// This is how agents update their state and share data.
func (c *ChatAgent) OnReceiveMessage(msgName string, data *string) (*string, error) {
	switch msgName {
	case "new_user_message":
		return c.chat(data)

	case "get_chat_history":
		// Return the chat history as a string.
		return &c.chatHistory, nil
	}
	return nil, nil

}
func (c *ChatAgent) chat(data *string) (*string, error) {
	// keep max of 10 messages in the chat history
	//h := strings.Split(c.chatHistory, "\n")
	//last10 := strings.Join(h[len(h)-MAX_HISTORY:], "\n")
	//c.chatHistory = last10 + *data + "\n"

	model, _ := models.GetModel[openai.ChatModel](MODEL_NAME)
	session_ID = c.Id()

	loopLimit := 3 // Maximum number of loops

	llmResponse := llmWithTools(
		model,
		chatTools(),
		systemPrompt(),
		*data,
		c.chatHistory,
		openai.ResponseFormatText,
		executeToolCall,
		loopLimit,
		MAX_HISTORY,
	)
	c.chatHistory = llmResponse.ChatHistory

	fmt.Println(llmResponse.Response)

	return &llmResponse.Response, nil

}
