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

type FlexibleThemeEvent map[string]interface{}

func (e FlexibleThemeEvent) EventName() string {
	if eventType, ok := e["eventType"].(string); ok && eventType != "" {
		return eventType
	}

	if title, ok := e["title"].(string); ok && title != "" {
		return strings.ToLower(strings.ReplaceAll(title, " ", "_"))
	}

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

func (a *ThemedAgent) Name() string {
	return "ThemedAgent"
}

func (a *ThemedAgent) OnInitialize() error {
	a.MaxEvents = 100
	a.EventCount = 0
	a.StartTime = time.Now()
	a.IsActive = true
	a.LastEventTime = time.Now()

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

	a.EventCount++
	a.LastEventTime = time.Now()

	elapsed := time.Since(a.StartTime)
	statusEvent := AgentStatusEvent{
		Status:      "generating",
		EventCount:  a.EventCount,
		MaxEvents:   a.MaxEvents,
		Theme:       a.Theme,
		TimeElapsed: elapsed.Round(time.Second).String(),
	}

	err := a.PublishEvent(statusEvent)
	if err != nil {
		return nil, fmt.Errorf("failed to publish status: %w", err)
	}

	event, err := a.generateThemeEvent()
	if err != nil {
		return nil, fmt.Errorf("failed to generate event: %w", err)
	}

	err = a.PublishEvent(event)
	if err != nil {
		return nil, fmt.Errorf("failed to publish event: %w", err)
	}

	result := fmt.Sprintf("Generated event %d/%d for theme: %s", a.EventCount, a.MaxEvents, a.Theme)
	return &result, nil
}

func (a *ThemedAgent) generateThemeEvent() (FlexibleThemeEvent, error) {
	model, err := models.GetModel[openai.ChatModel]("text-generator")
	if err != nil {
		return nil, err
	}

	prompt := fmt.Sprintf(`You are an event generator for the theme "%s". 
Generate a realistic pseudo-event that fits this theme. 

IMPORTANT: The "eventType" field will be used as the event name, so make it descriptive like "security_breach", "system_malfunction", "mission_update", etc.

Respond with ONLY a JSON object like this:
{
  "eventType": "descriptive_event_name_here",
  "title": "Brief event title", 
  "description": "Detailed description of what happened",
  "severity": "LOW, MEDIUM, HIGH, or CRITICAL",
  "location": "where this event occurred (optional)",
  "additionalField1": "any other relevant data",
  "additionalField2": "more relevant data"
}

Make it creative and thematic to "%s". Add 2-4 additional fields that make sense for the event type and theme. Keep structure flat - no nested objects.`, a.Theme, a.Theme)

	input, err := model.CreateInput(
		openai.NewSystemMessage("You are a creative event generator. Always respond with valid JSON only. Use flat structure - no nested objects."),
		openai.NewUserMessage(prompt),
	)
	if err != nil {
		fmt.Printf("Error creating model input: %v\n", err)
		return nil, err
	}

	input.Temperature = 0.8

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

	// Create the event and ensure it has the correct structure
	event := FlexibleThemeEvent(eventData)

	// Ensure we have an eventType at the root level for EventName() to work
	if _, hasEventType := event["eventType"]; !hasEventType {
		// If no eventType, try to derive it from title or use a default
		if title, ok := event["title"].(string); ok {
			event["eventType"] = strings.ToLower(strings.ReplaceAll(title, " ", "_"))
		} else {
			event["eventType"] = "theme_event"
		}
	}

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

func init() {
	agents.Register(&ThemedAgent{})
}
