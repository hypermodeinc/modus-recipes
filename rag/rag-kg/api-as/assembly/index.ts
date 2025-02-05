/**
 * This file is the entry point for the assembly API.
 */
import { models } from "@hypermode/modus-sdk-as";
import { JSON } from "json-as";
import {
  OpenAIChatModel,
  ResponseFormat,
  SystemMessage,
  UserMessage,
} from "@hypermode/modus-sdk-as/models/openai/chat";

import { Ontology, Entity, getOntologyByName } from "./ontology";
import { LAB_DGRAPH } from "./dgraph-utils";
export { addClass } from "./ontology";
import { addEntity } from "./ontology";
export function getOntology(): Ontology {
  return getOntologyByName("rag/example");
}

export function extractEntities(
  text: string,
  ontology: Ontology | null = null,
): Entity[] {
  // if not provided get the ontology from the connected Knowledge Graph
  // extractEntities can be used in a pipeline where the ontology is already loaded
  // or to test an ontology before saving it to the Knowledge Graph
  if (ontology == null) {
    ontology = getOntology();
  }
  // The imported OpenAIChatModel interface follows the OpenAI chat completion model input format.
  const model = models.getModel<OpenAIChatModel>("llm");
  model.debug = true;
  var instruction = `User submits a text. List the main entities from the text.
  Look only for the entities that are in the following list:
  LIST OF KNOWN ENTITIES:
  `;
  for (let i = 0; i < ontology.classes.length; i++) {
    instruction += `${ontology.classes[i].label}: ${ontology.classes[i].description}\n`;
  }

  instruction += `Reply with a JSON document containing the list of entities with an identifier label and a short semantic description using the example:
  {
    "list": [{"label": "Uranus", "is_a": "CelestialBody", "description": "a planet from the solar system."}]
  }`;

  // We'll start by creating an input object using the instruction and prompt provided.
  const input = model.createInput([
    new SystemMessage(instruction),
    new UserMessage(text),
  ]);
  input.temperature = 0.7;
  input.responseFormat = ResponseFormat.Json;
  const output = model.invoke(input);
  const llm_response = output.choices[0].message.content.trim();
  const list = JSON.parse<LAB_DGRAPH.ListOf<Entity>>(llm_response).list;
  /*
   * Entity extraction using an LLM can lead to error when many entities are present in the text.
   * We need to verify the entities extracted by the LLM.
   */
  const verified_response: Entity[] = [];
  for (let i = 0; i < list.length; i++) {
    if (verifyEntity(list[i])) {
      verified_response.push(list[i]);
    }
  }
  return verified_response;
}
/**
 *
 * This function is used to verify the entities extracted by the LLM.
 * This can be done with an entailment model trained on the ontology.
 * We are using an LLM at the moment.
 */

function verifyEntity(entity: Entity): bool {
  const assertion = `${entity.label}, ${entity.description}, is a ${entity.is_a}.`;
  var instruction =
    `Reply 'true' or 'false' to following assertion: ` + assertion;

  const model = models.getModel<OpenAIChatModel>("llm");
  model.debug = true;
  const input = model.createInput([new UserMessage(instruction)]);

  // This is one of many optional parameters available for the OpenAI chat model.
  input.temperature = 0.7;
  input.responseFormat = ResponseFormat.Text;
  return model
    .invoke(input)
    .choices[0].message.content.toLowerCase()
    .includes("true");
}

export function saveEntities(entity: Entity): string {
  return addEntity("rag/example", entity);
}
export function analyzeRelationships(text: string): string {
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
    new UserMessage(text),
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
