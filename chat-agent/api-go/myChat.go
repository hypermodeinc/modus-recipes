package main

import (
	"fmt"
	"strings"
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
	prompt := fmt.Sprintf(`Today is %s. The user name is "Me".
	When user input is a question, use search_fact_by_term or search_by_entity tool with a list of terms and reply using the data retrieved.
	Reply that you don't have that in memory if nothing is found.
	If the user input is a statement, use the save_fact tool and confirm that you have saved the fact in your memory.
	Try to extract the entities linked to the fact such as place, city, country, person, organization, event, item, etc.
	For first-person sentence always link a person entity with the user name.
	If the user input is about several facts, use the save_fact tool for each fact and confirm that you'll remember them.
    
	`, isoTime)
	return prompt
}

/* specific to this chat agent */
func chatTools() []openai.Tool {
	tools := []openai.Tool{
		openai.NewToolForFunction("save_fact", "use to save facts when user states something").
			WithParameter("fact", "string", `fact to be remembered`).
			WithParameter("entities", "string", "a list of entities like place, person. The string is formatted as 'Type:Name' pairs separated by commas, like 'place:Paris, person:Will, person:John'.").
			WithParameter("happened_on", "string", `empty or date in format YYYY-MM-DD if the fact is an event associated with a date`),
		openai.NewToolForFunction("search_fact_by_term", "Retrieve a fact from key words").
			WithParameter("terms", "string", `terms to search for separated by space`),
		openai.NewToolForFunction("search_by_entity", "Search for an entity like place, person or item and the related facts").
			WithParameter("entity", "string", `name of the entity to search for`),
		openai.NewToolForFunction("all_facts", "Retrieve all facts saved in memory"),
	}
	return tools
}

func executeToolCall(tool_call openai.ToolCall) (*string, error) {

	// Parse JSON into a map of strings
	params_map := make(map[string]string)
	gjson.Parse(tool_call.Function.Arguments).ForEach(func(key, value gjson.Result) bool {
		params_map[key.String()] = value.String()
		return true
	})
	fmt.Println("Tool call:", tool_call.Function.Name, params_map)
	if tool_call.Function.Name == "save_fact" {
		return save_fact(params_map["fact"], params_map["entities"], params_map["happened_on"])
	} else if tool_call.Function.Name == "search_fact_by_term" {
		if params_map["terms"] == "" {
			return nil, fmt.Errorf("terms parameter is required for search_fact_by_term")
		}
		return search_fact(params_map["terms"])
	} else if tool_call.Function.Name == "search_by_entity" {
		entity := params_map["entity"]
		if entity == "" {
			return nil, fmt.Errorf("entity parameter is required for search_by_entity")
		}
		return facts_by_entity(entity)
	} else if tool_call.Function.Name == "all_facts" {
		return all_facts()
	}
	return nil, fmt.Errorf("unknown tool call: %s", tool_call.Function.Name)
}

type Entity struct {
	entityType string
	name       string
}

func parseEntities(entities string) []Entity {
	entitiesArray := []Entity{}
	// Split the entities string by commas to get each key-value pair
	parts := strings.Split(entities, ",")
	for _, part := range parts {
		// Split each part by the first colon to separate key and value
		kv := strings.SplitN(part, ":", 2)
		if len(kv) == 2 {
			key := strings.TrimSpace(kv[0])
			value := strings.TrimSpace(kv[1])
			if key != "" && value != "" {
				entitiesArray = append(entitiesArray, Entity{entityType: key, name: value})
			}
		}
	}
	return entitiesArray
}

func save_fact(fact string, entities string, happened_on string) (*string, error) {
	fmt.Println("Fact:", fact)
	fmt.Println("Entities:", entities)
	fmt.Println("Happened on:", happened_on)

	// Parse entities string into an array of key-value pairs
	entitiesArray := parseEntities(entities)

	// Save a fact as a node in Dgraph with attributes sessionId, fact and timestamp
	timestamp := time.Now().UTC().Format(time.RFC3339)

	// Build query for finding existing entities
	queryBlock := ""
	if len(entitiesArray) > 0 {
		queryBlock = "{\n"
		for i, entity := range entitiesArray {
			entityUrn := entity.entityType + "." + entity.name
			entityVar := fmt.Sprintf("entity_%d", i)
			queryBlock += fmt.Sprintf(`  %s as var(func: eq(entity.id, "%s"))`+"\n", entityVar, entityUrn)
		}
		queryBlock += "}"
	}

	// Build RDF mutation
	rdf := fmt.Sprintf(`
		<_:fact> <created_at> "%s" .
		<_:fact> <fact> "%s" .`, timestamp, fact)

	// Add entity relationships
	for i, entity := range entitiesArray {
		entityUrn := entity.entityType + "." + entity.name
		entityVar := fmt.Sprintf("entity_%d", i)
		rdf += fmt.Sprintf(`
		<_:fact> <fact.entity> uid(%s) .
		uid(%s) <entity.id> "%s" .
		uid(%s) <entity.type> "%s" .
		uid(%s) <entity.name> "%s" .`,
			entityVar, entityVar, entityUrn, entityVar, entity.entityType, entityVar, entity.name)
	}

	// If the fact is associated with a date, add it to the RDF
	if happened_on != "" {
		_, err := time.Parse("2006-01-02", happened_on)
		if err == nil {
			rdf += fmt.Sprintf(`
		<_:fact> <happened_on> "%s" .`, happened_on)
		}
	}

	// Create query and mutation
	var query *dgraph.Query
	if queryBlock != "" {
		query = dgraph.NewQuery(queryBlock)
	} else {
		query = dgraph.NewQuery("{}")
	}

	mutation := dgraph.NewMutation().WithSetNquads(rdf)

	_, err := dgraph.ExecuteQuery(connection, query, mutation)
	if err != nil {
		fmt.Printf("Error executing DQL: %v\n", err)
		fmt.Printf("Query: %s\n", queryBlock)
		fmt.Printf("RDF: %s\n", rdf)
		return nil, err
	}

	defaultResponse := "Fact saved"
	return &defaultResponse, nil
}

func search_fact(terms string) (*string, error) {
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

func facts_by_entity(entity string) (*string, error) {
	dql := fmt.Sprintf(`query {
		facts(func: anyofterms(entity.name, "%s")) {
			name:location.name
			type:entity.type
			~fact.entity {
				created_at
				fact
			}
		}
	}`, entity)

	query := dgraph.NewQuery(dql)
	res, err := dgraph.ExecuteQuery(connection, query)
	if err != nil {
		return nil, err
	}
	return &res.Json, nil
}

func all_facts() (*string, error) {
	dql := `query {
		facts(func: has(fact)) {
			fact
			created_at
			location { name:location.name }
		}
	}`

	query := dgraph.NewQuery(dql)
	res, err := dgraph.ExecuteQuery(connection, query)
	if err != nil {
		return nil, err
	}
	return &res.Json, nil
}
