package main

import (
	"fmt"
	"time"

	"github.com/hypermodeinc/modus/sdk/go/pkg/models/openai"
	"github.com/tidwall/gjson"
)

func systemPrompt() string {
	/*
	* Default prompt provides the global context of your chat.
	* one option is to save this global prompt in Dgraph and expose an admin function to update it.
	* This way you can update the global context without changing the code.
	* This example is using a hardcoded prompt.
	* The prompt provides the main goal for the chat and instruct the LLM to use the provided tools.
	* As an example of context data we also provide the current date in the prompt.
	 */
	isoTime := time.Now().UTC().Format(time.RFC3339)
	prompt := fmt.Sprintf(`Today is %s. 
    You are a helpful assitant who can save fact in memory and reply to questions by searching for saved facts.
	If the user input is a statement, use the save_fact tool and confirm that you'll rember.
	If the user input is a question, check the chat history first and use the search_fact tool if needed with selected list of terms and reply using the data retrieved.
	Reply that you don't have that in memory if the nothing is found.
	`, isoTime)
	return prompt
}

/* specific to this chat agent */
func chatTools() []openai.Tool {
	tools := []openai.Tool{
		openai.NewToolForFunction("save_fact", "list of hotels matching the user criteria").
			WithParameter("fact", "string", `fact to be remembered`),
		openai.NewToolForFunction("search_fact", "Retrieve a fact from key words").
			WithParameter("words", "string", `words separated by space`),
	}
	return tools
}

func executeToolCall(tool_call openai.ToolCall) string {
	// Parse JSON into a map of strings
	params_map := make(map[string]string)
	gjson.Parse(tool_call.Function.Arguments).ForEach(func(key, value gjson.Result) bool {
		params_map[key.String()] = value.String()
		return true
	})
	fmt.Println("Tool call:", tool_call.Function.Name, params_map)
	if tool_call.Function.Name == "save_fact" {
		return save_fact(session_ID, tool_call.Function.Arguments)
	} else if tool_call.Function.Name == "search_fact" {
		return search_fact(session_ID, tool_call.Function.Arguments)
	}
	return ""
}

func save_fact(sessionId string, arguments string) string {
	// Save the chat history to a database or file
	// This is a placeholder function. You can implement your own logic to save the memory.
	fmt.Println("Saving memory for session:", sessionId)
	fmt.Println("Fact:", arguments)

	// Save a fact as a node in Dgraph with attributes sessionId, fact and timestamp
	// timestamp := time.Now().UTC().Format(time.RFC3339)
	// dgraphClient.Mutate(sessionId, fact, timestamp)
	// Example: dgraphClient.Mutate("sessionId", "fact", "timestamp")
	return "Fact saved"

}

func search_fact(sessionID string, arguments string) string {
	return "Brian is in the kitchen"
}
