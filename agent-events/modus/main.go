package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/hypermodeinc/modus/sdk/go/pkg/agents"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models/openai"
)

// ThemedAgent generates events based on a specific theme
type ThemedAgent struct {
	agents.AgentBase
	AgentId       string    `json:"agent_id"`
	Theme         string    `json:"theme"`
	EventCount    int       `json:"event_count"`
	MaxEvents     int       `json:"max_events"`
	StartTime     time.Time `json:"start_time"`
	IsActive      bool      `json:"is_active"`
	LastEventTime time.Time `json:"last_event_time"`
}

// Agent event types that will be published
type FlexibleThemeEvent map[string]interface{}

func (e FlexibleThemeEvent) EventName() string {
	return "theme_event"
}

type AgentStatusEvent struct {
	Status      string `json:"status"`
	EventCount  int    `json:"eventCount"`
	MaxEvents   int    `json:"maxEvents"`
	Theme       string `json:"theme"`
	TimeElapsed string `json:"timeElapsed"`
}

func (e AgentStatusEvent) EventName() string {
	return "agent_status"
}

type AgentCompletedEvent struct {
	Theme        string `json:"theme"`
	TotalEvents  int    `json:"totalEvents"`
	Duration     string `json:"duration"`
	FinalMessage string `json:"finalMessage"`
}

func (e AgentCompletedEvent) EventName() string {
	return "agent_completed"
}

// Agent implementation
func (a *ThemedAgent) Name() string {
	return "ThemedAgent"
}

func (a *ThemedAgent) OnInitialize() error {
	a.MaxEvents = 100
	a.EventCount = 0
	a.StartTime = time.Now()
	a.IsActive = true
	a.LastEventTime = time.Now()

	// Publish initialization event
	err := a.PublishEvent(AgentStatusEvent{
		Status:      "initialized",
		EventCount:  0,
		MaxEvents:   a.MaxEvents,
		Theme:       a.Theme,
		TimeElapsed: "0s",
	})

	return err
}

func (a *ThemedAgent) OnReceiveMessage(messageName string, data *string) (*string, error) {
	switch messageName {
	case "initialize_theme":
		if data != nil && *data != "" {
			a.Theme = *data
			result := fmt.Sprintf("Agent initialized with theme: %s", a.Theme)
			return &result, nil
		}
		return nil, fmt.Errorf("theme data is required")
	case "start_generation":
		return a.startEventGeneration()
	case "start_rapid_generation":
		return a.startRapidGeneration()
	case "get_status":
		return a.getStatus()
	case "stop":
		return a.stopGeneration()
	default:
		return nil, fmt.Errorf("unknown message: %s", messageName)
	}
}

func (a *ThemedAgent) GetState() *string {
	state := map[string]interface{}{
		"agent_id":        a.AgentId,
		"theme":           a.Theme,
		"event_count":     a.EventCount,
		"max_events":      a.MaxEvents,
		"start_time":      a.StartTime.Unix(),
		"is_active":       a.IsActive,
		"last_event_time": a.LastEventTime.Unix(),
	}

	stateBytes, _ := json.Marshal(state)
	stateStr := string(stateBytes)
	return &stateStr
}

func (a *ThemedAgent) SetState(data *string) {
	if data == nil || *data == "" {
		return
	}

	var state map[string]interface{}
	if err := json.Unmarshal([]byte(*data), &state); err != nil {
		return
	}

	if agentId, ok := state["agent_id"].(string); ok {
		a.AgentId = agentId
	}
	if theme, ok := state["theme"].(string); ok {
		a.Theme = theme
	}
	if count, ok := state["event_count"].(float64); ok {
		a.EventCount = int(count)
	}
	if maxEvents, ok := state["max_events"].(float64); ok {
		a.MaxEvents = int(maxEvents)
	}
	if startTime, ok := state["start_time"].(float64); ok {
		a.StartTime = time.Unix(int64(startTime), 0)
	}
	if isActive, ok := state["is_active"].(bool); ok {
		a.IsActive = isActive
	}
	if lastEventTime, ok := state["last_event_time"].(float64); ok {
		a.LastEventTime = time.Unix(int64(lastEventTime), 0)
	}
}

func (a *ThemedAgent) startEventGeneration() (*string, error) {
	if !a.IsActive {
		result := "Agent is not active"
		return &result, nil
	}

	if a.EventCount >= a.MaxEvents {
		result := "Agent has completed all events"
		return &result, nil
	}

	// Generate and publish event
	event, err := a.generateThemeEvent()
	if err != nil {
		return nil, fmt.Errorf("failed to generate event: %w", err)
	}

	// Publish the themed event
	err = a.PublishEvent(event)
	if err != nil {
		return nil, fmt.Errorf("failed to publish event: %w", err)
	}

	a.EventCount++
	a.LastEventTime = time.Now()

	// Publish status update
	elapsed := time.Since(a.StartTime)
	statusEvent := AgentStatusEvent{
		Status:      "generating",
		EventCount:  a.EventCount,
		MaxEvents:   a.MaxEvents,
		Theme:       a.Theme,
		TimeElapsed: elapsed.Round(time.Second).String(),
	}

	err = a.PublishEvent(statusEvent)
	if err != nil {
		return nil, fmt.Errorf("failed to publish status: %w", err)
	}

	// Check if we've reached the limit
	if a.EventCount >= a.MaxEvents {
		return a.completeGeneration()
	}

	result := fmt.Sprintf("Generated event %d/%d for theme: %s", a.EventCount, a.MaxEvents, a.Theme)
	return &result, nil
}

// New method for rapid generation (5 events in sequence)
func (a *ThemedAgent) startRapidGeneration() (*string, error) {
	if !a.IsActive {
		result := "Agent is not active"
		return &result, nil
	}

	if a.EventCount >= a.MaxEvents {
		result := "Agent has completed all events"
		return &result, nil
	}

	// Generate one event first
	result, err := a.startEventGeneration()
	if err != nil {
		return nil, err
	}

	// If we haven't completed yet, trigger the next rapid event
	if a.IsActive && a.EventCount < a.MaxEvents && a.AgentId != "" {
		// Send async message to continue rapid generation
		agents.SendMessageAsync(a.AgentId, "start_generation")
	}

	return result, nil
}

func (a *ThemedAgent) completeGeneration() (*string, error) {
	a.IsActive = false
	duration := time.Since(a.StartTime)

	// Publish completion event
	err := a.PublishEvent(AgentCompletedEvent{
		Theme:        a.Theme,
		TotalEvents:  a.EventCount,
		Duration:     duration.Round(time.Second).String(),
		FinalMessage: fmt.Sprintf("Completed %d themed events for '%s' in %v", a.EventCount, a.Theme, duration.Round(time.Second)),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to publish completion: %w", err)
	}

	result := fmt.Sprintf("Agent completed! Generated %d events for theme '%s' in %v", a.EventCount, a.Theme, duration.Round(time.Second))
	return &result, nil
}

func (a *ThemedAgent) generateThemeEvent() (FlexibleThemeEvent, error) {
	model, err := models.GetModel[openai.ChatModel]("text-generator")
	if err != nil {
		return nil, err
	}

	prompt := fmt.Sprintf(`You are an event generator for the theme "%s". 
Generate a realistic pseudo-event that fits this theme. 

The event should be interesting and dramatic but fictional.
Respond with ONLY a JSON object with these required fields plus any additional relevant fields:
{
  "eventType": "type of event (e.g. security_breach, mission_update, system_alert)",
  "title": "Brief event title",
  "description": "Detailed description of what happened",
  "severity": "LOW, MEDIUM, HIGH, or CRITICAL",
  "location": "where this event occurred (optional)",
  "additionalField1": "any other relevant data",
  "additionalField2": "more relevant data"
}

Make it creative and thematic to "%s". Add 2-4 additional fields that make sense for the event type and theme. Use flat structure - no nested objects.`, a.Theme, a.Theme)

	input, err := model.CreateInput(
		openai.NewSystemMessage("You are a creative event generator. Always respond with valid JSON only. Use flat structure - no nested objects."),
		openai.NewUserMessage(prompt),
	)
	if err != nil {
		// log the error and return a fallback event
		fmt.Printf("Error creating model input: %v\n", err)
		return nil, err
	}

	input.Temperature = 0.8 // Higher temperature for creativity

	output, err := model.Invoke(input)
	if err != nil {
		return nil, err
	}

	content := strings.TrimSpace(output.Choices[0].Message.Content)

	var eventData map[string]interface{}
	err = json.Unmarshal([]byte(content), &eventData)
	if err != nil {
		return nil, fmt.Errorf("failed to parse event JSON: %w", err)
	}

	event := FlexibleThemeEvent(eventData)
	return event, nil
}

func (a *ThemedAgent) getStatus() (*string, error) {
	status := map[string]interface{}{
		"agent_id":    a.AgentId,
		"theme":       a.Theme,
		"event_count": a.EventCount,
		"max_events":  a.MaxEvents,
		"is_active":   a.IsActive,
		"elapsed":     time.Since(a.StartTime).Round(time.Second).String(),
		"progress":    float64(a.EventCount) / float64(a.MaxEvents),
	}

	statusBytes, err := json.Marshal(status)
	if err != nil {
		return nil, err
	}

	result := string(statusBytes)
	return &result, nil
}

func (a *ThemedAgent) stopGeneration() (*string, error) {
	a.IsActive = false

	err := a.PublishEvent(AgentStatusEvent{
		Status:      "stopped",
		EventCount:  a.EventCount,
		MaxEvents:   a.MaxEvents,
		Theme:       a.Theme,
		TimeElapsed: time.Since(a.StartTime).Round(time.Second).String(),
	})
	if err != nil {
		return nil, err
	}

	result := fmt.Sprintf("Agent stopped. Generated %d/%d events for theme: %s", a.EventCount, a.MaxEvents, a.Theme)
	return &result, nil
}

// Register the agent
func init() {
	agents.Register(&ThemedAgent{})
}

// Public functions that become GraphQL mutations/queries

// CreateAgent creates a new agent and returns just the ID
func CreateAgent() (string, error) {
	agentInfo, err := agents.Start("ThemedAgent")
	if err != nil {
		return "", err
	}

	return agentInfo.Id, nil
}

// SetTheme sets the theme for an existing agent
func UpdateAgentTheme(agentId string, theme string) (string, error) {
	if theme == "" {
		return "", fmt.Errorf("theme cannot be empty")
	}

	result, err := agents.SendMessage(agentId, "initialize_theme", agents.WithData(theme))
	if err != nil {
		return "", fmt.Errorf("failed to set theme for agent: %w", err)
	}

	if result == nil {
		return "", fmt.Errorf("no response from agent")
	}

	return *result, nil
}

// StartEventGeneration triggers a single event
func MutateStartEventGeneration(agentId string) (string, error) {
	err := agents.SendMessageAsync(agentId, "start_generation")
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("Event generation triggered for agent: %s", agentId), nil
}

// StartRapidGeneration triggers rapid event generation (self-managing)
func MutateStartRapidGeneration(agentId string) (string, error) {
	err := agents.SendMessageAsync(agentId, "start_rapid_generation")
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("Rapid event generation started for agent: %s", agentId), nil
}

// GetAgentStatus returns the current status of an agent
func GetAgentStatus(agentId string) (string, error) {
	result, err := agents.SendMessage(agentId, "get_status")
	if err != nil {
		return "", err
	}
	if result == nil {
		return "", fmt.Errorf("no response from agent")
	}
	return *result, nil
}

// StopAgent stops an agent's event generation asynchronously
func StopAgent(agentId string) (string, error) {
	// Use async message to stop the agent
	err := agents.SendMessageAsync(agentId, "stop")
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("Stop signal sent to agent: %s", agentId), nil
}

// Agents returns all active agents (renamed from ListAgents to match GraphQL field name)
func Agents() ([]agents.AgentInfo, error) {
	return agents.ListAll()
}
