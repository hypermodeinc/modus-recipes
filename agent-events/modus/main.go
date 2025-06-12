package main

import (
	"fmt"

	"github.com/hypermodeinc/modus/sdk/go/pkg/agents"
)

func CreateThemedAgent(theme string) (string, error) {
	if theme == "" {
		return "", fmt.Errorf("theme cannot be empty")
	}

	agentInfo, err := agents.Start("ThemedAgent")
	if err != nil {
		return "", fmt.Errorf("failed to start agent: %w", err)
	}

	_, err = agents.SendMessage(agentInfo.Id, "initialize_theme", agents.WithData(theme))
	if err != nil {
		return "", fmt.Errorf("failed to set theme for agent: %w", err)
	}

	return agentInfo.Id, nil
}

func MutateStartEventGeneration(agentId string) (string, error) {
	err := agents.SendMessageAsync(agentId, "start_generation")
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("Event generation triggered for agent: %s", agentId), nil
}

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

func StopAgent(agentId string) (string, error) {
	_, err := agents.Stop(agentId)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("Stop signal sent to agent: %s", agentId), nil
}

func Agents() ([]agents.AgentInfo, error) {
	return agents.ListAll()
}
