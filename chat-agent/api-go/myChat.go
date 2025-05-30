package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hypermodeinc/modus/sdk/go/pkg/dgraph"
	"github.com/hypermodeinc/modus/sdk/go/pkg/models/openai"
	"github.com/tidwall/gjson"
)

const connection = "dgraph"

type Fact struct {
	CreatedAt string `json:"created_at,omitempty"`
	Fact      string `json:"fact,omitempty"`
}

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
    You save fact in memory and reply to questions by searching for saved facts.
	If the user input is a statement, use the save_fact tool and confirm that you'll remember that fact.
	If the user input is about several facts, use the save_fact tool for each fact and confirm that you'll remember them.
	If the user input is a question, check the chat history first and use the search_fact tool if needed with selected list of terms and reply using the data retrieved.
	Reply that you don't have that in memory if nothing is found.
	`, isoTime)
	return prompt
}

/* specific to this chat agent */
func chatTools() []openai.Tool {
	tools := []openai.Tool{
		openai.NewToolForFunction("save_fact", "use to save facts when user states something").
			WithParameter("fact", "string", `fact to be remembered`),
		openai.NewToolForFunction("search_fact", "Retrieve a fact from key words").
			WithParameter("terms", "string", `terms to search for separated by space`),
	}
	return tools
}

func executeToolCall(tool_call openai.ToolCall) (*string, error) {
	session_ID := "fake_session_id"
	// not supported yet, all facts saved with same context.

	// Parse JSON into a map of strings
	params_map := make(map[string]string)
	gjson.Parse(tool_call.Function.Arguments).ForEach(func(key, value gjson.Result) bool {
		params_map[key.String()] = value.String()
		return true
	})
	fmt.Println("Tool call:", tool_call.Function.Name, params_map)
	if tool_call.Function.Name == "save_fact" {
		return save_fact(session_ID, params_map["fact"])
	} else if tool_call.Function.Name == "search_fact" {
		return search_fact(session_ID, params_map["terms"])
	}
	return nil, fmt.Errorf("unknown tool call: %s", tool_call.Function.Name)
}

func save_fact(sessionId string, fact string) (*string, error) {
	// save to Dgraph
	fmt.Println("Saving memory for session:", sessionId)
	fmt.Println("Fact:", fact)

	// Save a fact as a node in Dgraph with attributes sessionId, fact and timestamp
	timestamp := time.Now().UTC().Format(time.RFC3339)
	factObject := Fact{
		CreatedAt: timestamp,
		Fact:      fact,
	}
	factJson, err := json.Marshal(factObject)
	if err != nil {
		return nil, err
	}

	mutation := dgraph.NewMutation().WithSetJson(string(factJson))

	_, err = dgraph.ExecuteMutations(connection, mutation)
	if err != nil {
		return nil, err
	}
	defaultResponse := "Fact saved"
	return &defaultResponse, nil

}

func search_fact(sessionID string, terms string) (*string, error) {
	dql := fmt.Sprintf(`query {
		facts(func: anyofterms(fact, "%s")) {
			fact
			created_at
		}
	}`, terms)

	query := dgraph.NewQuery(dql)
	res, err := dgraph.ExecuteQuery(connection, query)
	if err != nil {
		return nil, err
	}
	return &res.Json, nil
}
