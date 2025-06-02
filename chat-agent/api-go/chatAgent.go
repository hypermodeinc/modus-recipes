package main

import (
	"encoding/json"
	"fmt"

	"github.com/hypermodeinc/modus/sdk/go/pkg/agents"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models/openai"
)

const (
	MAX_HISTORY = 10
	MODEL_NAME  = "text-generator"
)

type ChatAgent struct {
	agents.AgentBase
	state ChatAgentState
}

type ChatAgentState struct {
	ChatHistory string
}

func (c *ChatAgent) Name() string {
	return "Chat-v1"
}

func (c *ChatAgent) GetState() *string {
	serializedState, _ := json.Marshal(c.state)
	serializedStateStr := string(serializedState)
	return &serializedStateStr
}

func (c *ChatAgent) SetState(data *string) {
	err := json.Unmarshal([]byte(*data), &c.state)
	if err != nil {
		fmt.Println("Error unmarshalling state:", err)
	}
}

func (c *ChatAgent) OnStart() error {
	c.state.ChatHistory = ""
	fmt.Println("Agent started")
	return nil
}

func (c *ChatAgent) OnReceiveMessage(msgName string, data *string) (*string, error) {
	switch msgName {
	case "new_user_message":
		return c.chat(data)
	case "get_chat_history":
		return &c.state.ChatHistory, nil
	default:
		return nil, nil
	}
}

func (c *ChatAgent) chat(data *string) (*string, error) {
	model, _ := models.GetModel[openai.ChatModel](MODEL_NAME)
	loopLimit := 3

	llmResponse := llmWithTools(
		model,
		chatTools(),
		systemPrompt(),
		*data,
		c.state.ChatHistory,
		openai.ResponseFormatText,
		executeToolCall,
		loopLimit,
		MAX_HISTORY,
	)

	c.state.ChatHistory = llmResponse.ChatHistory
	fmt.Println(llmResponse.Response)

	return &llmResponse.Response, nil
}

func (c *ChatAgent) DeleteAgent(id string) error {
	_, err := agents.Stop(id)
	return err
}
