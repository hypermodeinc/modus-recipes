package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hypermodeinc/modus/sdk/go/pkg/agents"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models/openai"
)

const (
	MODEL_NAME      = "text-generator"
	MAX_HISTORY     = 20
	TOOL_LOOP_LIMIT = 3
)

// Response item types
type ResponseItemType string

const (
	ResponseTypeMessage  ResponseItemType = "message"
	ResponseTypeToolCall ResponseItemType = "tool_call"
	ResponseTypeCard     ResponseItemType = "card"
)

type ResponseItem struct {
	ID        string           `json:"id"`
	Type      ResponseItemType `json:"type"`
	Timestamp string           `json:"timestamp,omitempty"`
}

type MessageItem struct {
	ResponseItem
	Content string `json:"content"`
	Role    string `json:"role"`
}

type ToolCallItem struct {
	ResponseItem
	ToolCall ToolCallData `json:"toolCall"`
}

type CardItem struct {
	ResponseItem
	Card CardData `json:"card"`
}

type ToolCallData struct {
	ID        string                 `json:"id"`
	Name      string                 `json:"name"`
	Arguments map[string]interface{} `json:"arguments"`
	Status    string                 `json:"status"`
	Result    interface{}            `json:"result,omitempty"`
	Error     string                 `json:"error,omitempty"`
}

type CardData struct {
	ID      string                 `json:"id"`
	Type    string                 `json:"type"`
	Title   string                 `json:"title,omitempty"`
	Content map[string]interface{} `json:"content"`
	Actions []CardAction           `json:"actions,omitempty"`
}

type CardAction struct {
	ID     string                 `json:"id"`
	Label  string                 `json:"label"`
	Type   string                 `json:"type"`
	Action string                 `json:"action"`
	Data   map[string]interface{} `json:"data,omitempty"`
}

type ChatAgentState struct {
	ConversationId string                  `json:"conversationId"`
	Items          []interface{}           `json:"items"`
	ChatHistory    []openai.RequestMessage `json:"chatHistory"`
	LastActivity   time.Time               `json:"lastActivity"`
}

type ChatAgent struct {
	agents.AgentBase
	conversationId string
	items          []interface{}
	chatHistory    []openai.RequestMessage
	lastActivity   time.Time
}

func (c *ChatAgent) Name() string {
	return "KnowledgeAgent"
}

func (c *ChatAgent) GetState() *string {
	state := ChatAgentState{
		ConversationId: c.conversationId,
		Items:          c.items,
		ChatHistory:    c.chatHistory,
		LastActivity:   c.lastActivity,
	}

	data, err := json.Marshal(state)
	if err != nil {
		fmt.Printf("Error marshaling state: %v\n", err)
		return nil
	}

	stateStr := string(data)
	return &stateStr
}

func (c *ChatAgent) SetState(data *string) {
	if data == nil {
		return
	}

	var state ChatAgentState
	if err := json.Unmarshal([]byte(*data), &state); err != nil {
		fmt.Printf("Error unmarshaling state: %v\n", err)
		return
	}

	c.conversationId = state.ConversationId
	c.items = state.Items
	c.chatHistory = state.ChatHistory
	c.lastActivity = state.LastActivity
}

func (c *ChatAgent) OnInitialize() error {
	c.lastActivity = time.Now()
	c.chatHistory = []openai.RequestMessage{}
	return nil
}

func (c *ChatAgent) OnSuspend() error {
	return nil
}

func (c *ChatAgent) OnResume() error {
	return nil
}

func (c *ChatAgent) OnTerminate() error {
	return nil
}

func (c *ChatAgent) OnReceiveMessage(msgName string, data *string) (*string, error) {
	switch msgName {
	case "chat":
		return c.handleChat(data)
	case "get_items":
		return c.getConversationItems()
	case "clear_items":
		return c.clearConversationItems()
	default:
		return nil, fmt.Errorf("unknown message type: %s", msgName)
	}
}

func (c *ChatAgent) handleChat(data *string) (*string, error) {
	if data == nil {
		return nil, fmt.Errorf("no message data provided")
	}

	var request struct {
		Message string `json:"message"`
	}
	if err := json.Unmarshal([]byte(*data), &request); err != nil {
		return nil, fmt.Errorf("failed to parse chat request: %v", err)
	}

	if c.conversationId == "" {
		c.conversationId = fmt.Sprintf("conv_%d", time.Now().UnixNano())
	}

	// Add user message to items and chat history
	userMessage := MessageItem{
		ResponseItem: ResponseItem{
			ID:        fmt.Sprintf("%d", time.Now().UnixNano()),
			Type:      ResponseTypeMessage,
			Timestamp: time.Now().Format(time.RFC3339),
		},
		Content: request.Message,
		Role:    "user",
	}
	c.items = append(c.items, userMessage)
	c.chatHistory = append(c.chatHistory, openai.NewUserMessage(request.Message))
	c.lastActivity = time.Now()

	var responseItems []interface{}

	// Generate AI response with tools
	response, toolItems, err := c.generateAIResponseWithTools(request.Message)
	if err != nil {
		return nil, fmt.Errorf("failed to generate AI response: %v", err)
	}

	// Add tool call items to response
	for _, item := range toolItems {
		c.items = append(c.items, item)
		responseItems = append(responseItems, item)
	}

	// Add assistant message
	if response != "" {
		assistantMessage := MessageItem{
			ResponseItem: ResponseItem{
				ID:        fmt.Sprintf("%d", time.Now().UnixNano()),
				Type:      ResponseTypeMessage,
				Timestamp: time.Now().Format(time.RFC3339),
			},
			Content: response,
			Role:    "assistant",
		}
		c.items = append(c.items, assistantMessage)
		responseItems = append(responseItems, assistantMessage)
	}

	// Limit chat history size
	if len(c.chatHistory) > MAX_HISTORY {
		c.chatHistory = c.chatHistory[len(c.chatHistory)-MAX_HISTORY:]
	}

	// Create response
	chatResponse := struct {
		Items          []interface{} `json:"items"`
		ConversationId string        `json:"conversationId"`
	}{
		Items:          responseItems,
		ConversationId: c.conversationId,
	}

	responseData, err := json.Marshal(chatResponse)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal response: %v", err)
	}

	responseStr := string(responseData)
	return &responseStr, nil
}

func (c *ChatAgent) generateAIResponseWithTools(userMessage string) (string, []interface{}, error) {
	model, err := models.GetModel[openai.ChatModel](MODEL_NAME)
	if err != nil {
		return "", nil, fmt.Errorf("failed to get model: %v", err)
	}

	tools := c.getKnowledgeTools()
	systemPrompt := c.getSystemPrompt()

	var toolItems []interface{}
	loops := 0

	// Create a working copy of chat history for this conversation
	workingHistory := make([]openai.RequestMessage, len(c.chatHistory))
	copy(workingHistory, c.chatHistory)

	for loops < TOOL_LOOP_LIMIT {
		input, err := model.CreateInput()
		if err != nil {
			return "", nil, fmt.Errorf("failed to create input: %v", err)
		}

		// Build messages: system + history
		input.Messages = []openai.RequestMessage{openai.NewSystemMessage(systemPrompt)}
		input.Messages = append(input.Messages, workingHistory...)

		input.Temperature = 0.7
		input.Tools = tools
		input.ToolChoice = openai.ToolChoiceAuto

		output, err := model.Invoke(input)
		if err != nil {
			return "", nil, fmt.Errorf("model invocation failed: %v", err)
		}

		message := output.Choices[0].Message

		// Add assistant message to working history
		workingHistory = append(workingHistory, message.ToAssistantMessage())

		// Check if there are tool calls
		if len(message.ToolCalls) > 0 {
			// Process each tool call
			for _, toolCall := range message.ToolCalls {
				// Create tool call item for UI
				toolCallItem := ToolCallItem{
					ResponseItem: ResponseItem{
						ID:        fmt.Sprintf("tool_%d", time.Now().UnixNano()),
						Type:      ResponseTypeToolCall,
						Timestamp: time.Now().Format(time.RFC3339),
					},
					ToolCall: ToolCallData{
						ID:        toolCall.Id,
						Name:      toolCall.Function.Name,
						Arguments: c.parseToolArguments(toolCall.Function.Arguments),
						Status:    "executing",
					},
				}

				// Execute tool
				result, err := c.executeKnowledgeTool(toolCall)
				if err != nil {
					toolCallItem.ToolCall.Status = "error"
					toolCallItem.ToolCall.Error = err.Error()
				} else {
					toolCallItem.ToolCall.Status = "completed"
					toolCallItem.ToolCall.Result = result
				}

				toolItems = append(toolItems, toolCallItem)

				// Add tool response to working history
				var toolResponse string
				if err != nil {
					toolResponse = fmt.Sprintf("Error: %s", err.Error())
				} else {
					resultJSON, _ := json.Marshal(result)
					toolResponse = string(resultJSON)
				}
				workingHistory = append(workingHistory, openai.NewToolMessage(&toolResponse, toolCall.Id))
			}
		} else {
			// No more tool calls, we have our final response
			c.chatHistory = workingHistory
			return message.Content, toolItems, nil
		}

		loops++
	}

	// If we hit the loop limit, return what we have
	c.chatHistory = workingHistory
	return "I've processed your request with the available tools.", toolItems, nil
}

func (c *ChatAgent) getKnowledgeTools() []openai.Tool {
	return []openai.Tool{
		openai.NewToolForFunction("save_fact", "Save a fact when user states something to remember").
			WithParameter("fact", "string", "The fact to be remembered").
			WithParameter("entities", "string", "Comma-separated list of entities like 'place:Paris, person:Will, person:John'").
			WithParameter("happened_on", "string", "Date in format YYYY-MM-DD if the fact is associated with a specific date"),

		openai.NewToolForFunction("search_fact_by_term", "Search for facts using keywords").
			WithParameter("terms", "string", "Search terms separated by spaces"),

		openai.NewToolForFunction("search_by_entity", "Search for facts related to a specific entity").
			WithParameter("entity", "string", "Name of the entity to search for"),

		openai.NewToolForFunction("all_facts", "Retrieve all saved facts"),
	}
}

func (c *ChatAgent) getSystemPrompt() string {
	return fmt.Sprintf(`Today is %s. You are a knowledge assistant that can remember and retrieve facts.

When users tell you facts, use the save_fact tool to store them with relevant entities.
When users ask questions, use the search tools to find relevant information.
Always acknowledge when you save facts and provide helpful responses when searching.

For fact saving, extract entities like places, people, organizations, events, etc.
For first-person statements, link to "user" as a person entity.

Be conversational and helpful in your responses.`, time.Now().UTC().Format(time.RFC3339))
}

func (c *ChatAgent) parseToolArguments(argsJSON string) map[string]interface{} {
	var args map[string]interface{}
	if err := json.Unmarshal([]byte(argsJSON), &args); err != nil {
		return map[string]interface{}{"raw": argsJSON}
	}
	return args
}

func (c *ChatAgent) executeKnowledgeTool(toolCall openai.ToolCall) (interface{}, error) {
	var args map[string]interface{}
	if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &args); err != nil {
		return nil, fmt.Errorf("failed to parse tool arguments: %v", err)
	}

	switch toolCall.Function.Name {
	case "save_fact":
		fact := c.getStringArg(args, "fact", "")
		entities := c.getStringArg(args, "entities", "")
		happenedOn := c.getStringArg(args, "happened_on", "")

		// Save to Dgraph
		result, err := save_fact(fact, entities, happenedOn)
		if err != nil {
			return nil, err
		}

		// Create a card to show the saved fact
		cardItem := CardItem{
			ResponseItem: ResponseItem{
				ID:        fmt.Sprintf("card_%d", time.Now().UnixNano()),
				Type:      ResponseTypeCard,
				Timestamp: time.Now().Format(time.RFC3339),
			},
			Card: CardData{
				ID:    fmt.Sprintf("fact_card_%d", time.Now().UnixNano()),
				Type:  "fact",
				Title: "Fact Saved",
				Content: map[string]interface{}{
					"fact":     fact,
					"entities": entities,
					"saved_at": time.Now().Format("2006-01-02 15:04:05"),
				},
				Actions: []CardAction{
					{
						ID:     "view_details",
						Label:  "View Details",
						Type:   "button",
						Action: "view_details",
						Data:   map[string]interface{}{"fact": fact},
					},
				},
			},
		}
		c.items = append(c.items, cardItem)

		return result, nil

	case "search_fact_by_term":
		terms := c.getStringArg(args, "terms", "")
		result, err := search_fact(terms)
		if err != nil {
			return nil, err
		}

		// Parse the result and create a card if facts were found
		var factsData map[string]interface{}
		if err := json.Unmarshal([]byte(*result), &factsData); err == nil {
			if facts, ok := factsData["facts"].([]interface{}); ok && len(facts) > 0 {
				cardItem := CardItem{
					ResponseItem: ResponseItem{
						ID:        fmt.Sprintf("card_%d", time.Now().UnixNano()),
						Type:      ResponseTypeCard,
						Timestamp: time.Now().Format(time.RFC3339),
					},
					Card: CardData{
						ID:    fmt.Sprintf("search_card_%d", time.Now().UnixNano()),
						Type:  "search_results",
						Title: fmt.Sprintf("Search Results for '%s'", terms),
						Content: map[string]interface{}{
							"query":         terms,
							"results_count": len(facts),
							"facts":         facts,
						},
						Actions: []CardAction{
							{
								ID:     "show_facts",
								Label:  "Show All Facts",
								Type:   "button",
								Action: "show_facts",
								Data:   map[string]interface{}{"facts": facts},
							},
						},
					},
				}
				c.items = append(c.items, cardItem)
			}
		}

		return result, nil

	case "search_by_entity":
		entity := c.getStringArg(args, "entity", "")
		result, err := facts_by_entity(entity)
		if err != nil {
			return nil, err
		}

		// Create a card for entity results
		var entityData map[string]interface{}
		if err := json.Unmarshal([]byte(*result), &entityData); err == nil {
			cardItem := CardItem{
				ResponseItem: ResponseItem{
					ID:        fmt.Sprintf("card_%d", time.Now().UnixNano()),
					Type:      ResponseTypeCard,
					Timestamp: time.Now().Format(time.RFC3339),
				},
				Card: CardData{
					ID:    fmt.Sprintf("entity_card_%d", time.Now().UnixNano()),
					Type:  "entity_facts",
					Title: fmt.Sprintf("Facts about '%s'", entity),
					Content: map[string]interface{}{
						"entity": entity,
						"data":   entityData,
					},
					Actions: []CardAction{
						{
							ID:     "search_entity",
							Label:  "Search Related",
							Type:   "button",
							Action: "search_entity",
							Data:   map[string]interface{}{"entity": entity},
						},
					},
				},
			}
			c.items = append(c.items, cardItem)
		}

		return result, nil

	case "all_facts":
		result, err := all_facts()
		if err != nil {
			return nil, err
		}

		// Create a card for all facts
		var factsData map[string]interface{}
		if err := json.Unmarshal([]byte(*result), &factsData); err == nil {
			cardItem := CardItem{
				ResponseItem: ResponseItem{
					ID:        fmt.Sprintf("card_%d", time.Now().UnixNano()),
					Type:      ResponseTypeCard,
					Timestamp: time.Now().Format(time.RFC3339),
				},
				Card: CardData{
					ID:    fmt.Sprintf("all_facts_card_%d", time.Now().UnixNano()),
					Type:  "all_facts",
					Title: "All Saved Facts",
					Content: map[string]interface{}{
						"facts": factsData["facts"],
						"total": len(factsData["facts"].([]interface{})),
					},
					Actions: []CardAction{
						{
							ID:     "show_facts",
							Label:  "View All",
							Type:   "button",
							Action: "show_facts",
							Data:   factsData,
						},
					},
				},
			}
			c.items = append(c.items, cardItem)
		}

		return result, nil

	default:
		return nil, fmt.Errorf("unknown tool: %s", toolCall.Function.Name)
	}
}

func (c *ChatAgent) getStringArg(args map[string]interface{}, key, defaultValue string) string {
	if val, ok := args[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return defaultValue
}

func (c *ChatAgent) getConversationItems() (*string, error) {
	response := struct {
		Items []interface{} `json:"items"`
		Count int           `json:"count"`
	}{
		Items: c.items,
		Count: len(c.items),
	}

	itemsData, err := json.Marshal(response)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal items: %v", err)
	}

	itemsStr := string(itemsData)
	return &itemsStr, nil
}

func (c *ChatAgent) clearConversationItems() (*string, error) {
	c.items = []interface{}{}
	c.chatHistory = []openai.RequestMessage{}
	c.lastActivity = time.Now()
	return nil, nil
}
