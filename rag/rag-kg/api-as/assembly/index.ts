/**
 * This file is the entry point for the assembly API.
 */
import { models } from "@hypermode/modus-sdk-as";

import {
  OpenAIChatModel,
  ResponseFormat,
  SystemMessage,
  UserMessage,
} from "@hypermode/modus-sdk-as/models/openai/chat";

import { Ontology, getOntologyByName } from "./ontology";

export function getOntology(): Ontology {
  return getOntologyByName("rag/example");
}

export function extractEntities(prompt: string): string {
  const ontology = getOntology();
  // The imported OpenAIChatModel interface follows the OpenAI chat completion model input format.
  const model = models.getModel<OpenAIChatModel>("llm");
  model.debug = true;
  var instruction = `list the main entities mentioned in the prompt.
  Look only for the entities that are in the following list:
  LIST OF KNOWN ENTITIES:
  `;
  for (let i = 0; i < ontology.entities.length; i++) {
    instruction += `${ontology.entities[i].label}: ${ontology.entities[i].description}\n`;
  }

  /*CelestialBody: a natural object in space, such as a planet, moon, or star.
  Location: a place or position.
  Organization: a group of people identified by a name.
  Fact: something we know to be true about an entity.
  */

  instruction += `Reply with a JSON document containing the list of entities with an identifier name and a short semantic description using the example:
  ["entities": [{"id": "Uranus", "type": "CelestialBody", "description": "a planet from the solar system."}]`;

  // We'll start by creating an input object using the instruction and prompt provided.
  const input = model.createInput([
    new SystemMessage(instruction),
    new UserMessage(prompt),
    // ... if we wanted to add more messages, we could do so here.
  ]);

  // This is one of many optional parameters available for the OpenAI chat model.
  input.temperature = 0.7;
  input.responseFormat = ResponseFormat.Json;

  // Here we invoke the model with the input we created.
  const output = model.invoke(input);

  // The output is also specific to the OpenAIChatModel interface.
  // Here we return the trimmed content of the first choice.
  return output.choices[0].message.content.trim();
}

export function analyzeRelationships(prompt: string): string {
  // The imported OpenAIChatModel interface follows the OpenAI chat completion model input format.
  const model = models.getModel<OpenAIChatModel>("llm");
  model.debug = true;
  const instruction = `List event and facts mentioned in the prompt. 
  AgentiveEvent: an event involving an agent that has occurred in the past and is now considered an established fact
  Fact: something we know to be true about an entity.


  
  Reply with a JSON document containing the list of entities with an identifier name and a short semantic description using the example:
  ["entities": [{"source": "name of the agent", "type": "AgentiveEvent", "description": "what happened"},
  {"source": "name of the entity", "type": "Fact", "description": "the fact."}]`;

  // We'll start by creating an input object using the instruction and prompt provided.
  const input = model.createInput([
    new SystemMessage(instruction),
    new UserMessage(prompt),
    // ... if we wanted to add more messages, we could do so here.
  ]);

  // This is one of many optional parameters available for the OpenAI chat model.
  input.temperature = 0.7;
  input.responseFormat = ResponseFormat.Json;

  // Here we invoke the model with the input we created.
  const output = model.invoke(input);

  // The output is also specific to the OpenAIChatModel interface.
  // Here we return the trimmed content of the first choice.
  return output.choices[0].message.content.trim();
}

export function suggestEntities(prompt: string): string {
  // The imported OpenAIChatModel interface follows the OpenAI chat completion model input format.
  const model = models.getModel<OpenAIChatModel>("llm");
  model.debug = true;
  const instruction = `You are building a knowledge base. Suggest entity concepts mentioned in the prompt.
  Reply with a JSON document containing the list of entities types and a short semantic description using the example:
  ["entities": [{"type": "Planet", "description": "a celestial body.", "pertinence": "a score of pertinence of the entity type to the prompt"}]
  Spot only abstract types that can apply to several entities and that are not in the Known types list.
  Known types:
  """
  Person: a human being identified by name or pronoun.
  CelestialBody: a natural object in space, such as a planet, moon, or star.
  Location: a place or position.
  Organization: a group of people identified by a name.
  AgentiveEvent: an event involving an agent that has occurred in the past and is now considered an established fact
  Fact: something we know to be true about an entity.
  """
 

  
  `;

  // We'll start by creating an input object using the instruction and prompt provided.
  const input = model.createInput([
    new SystemMessage(instruction),
    new UserMessage(prompt),
    // ... if we wanted to add more messages, we could do so here.
  ]);

  // This is one of many optional parameters available for the OpenAI chat model.
  input.temperature = 0.7;
  input.responseFormat = ResponseFormat.Json;

  // Here we invoke the model with the input we created.
  const output = model.invoke(input);

  // The output is also specific to the OpenAIChatModel interface.
  // Here we return the trimmed content of the first choice.
  return output.choices[0].message.content.trim();
}
