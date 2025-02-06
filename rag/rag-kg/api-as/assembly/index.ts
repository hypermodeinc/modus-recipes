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

import {
  Ontology,
  Entity,
  RelatedEntity,
  addEntities,
  addRelatedEntities,
  getOntologyByName,
} from "./ontology";
import { LAB_DGRAPH } from "./dgraph-utils";
export { addClass } from "./ontology";
export function getOntology(): Ontology {
  return getOntologyByName("rag/example");
}
const MODEL_DEBUG = false;

export function simulateEntities(text: string): Entity[] {
  const entities = JSON.parse<Entity[]>(`
    [
            {
                "label": "Jupiter",
                "is_a": "CelestialBody",
                "description": "the fifth and largest planet in the Solar System."
            },
            {
                "label": "Sun",
                "is_a": "CelestialBody",
                "description": "the star at the center of the Solar System."
            },
            {
                "label": "Saturn",
                "is_a": "CelestialBody",
                "description": "the sixth planet from the Sun and a gas giant."
            },
            {
                "label": "Uranus",
                "is_a": "CelestialBody",
                "description": "a planet from the solar system, classified as an ice giant."
            },
            {
                "label": "Neptune",
                "is_a": "CelestialBody",
                "description": "the eighth and farthest planet from the Sun in the Solar System, classified as an ice giant."
            },
            {
                "label": "Earth",
                "is_a": "CelestialBody",
                "description": "the third planet from the Sun and the only astronomical object known to harbor life."
            },
            {
                "label": "Moon",
                "is_a": "CelestialBody",
                "description": "Earth's only natural satellite."
            },
            {
                "label": "Venus",
                "is_a": "CelestialBody",
                "description": "the second planet from the Sun, known for its brightness in the night sky."
            }
        ]
    `);
  return entities;
}
export function readEntities(entities: Entity[]): string {
  var status = "";
  status += "Entities:\n";
  for (let i = 0; i < entities.length; i++) {
    status += `  ${entities[i].label} is a ${entities[i].is_a}\n`;
  }
  return status;
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
  model.debug = MODEL_DEBUG;
  var instruction = `User submits a text. List the main entities from the text.
  Look only for the entities that are in the following types:
  LIST OF KNOWN ENTITY TYPES::
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
    } else {
      console.warn(`Removing ${list[i].is_a} : ${list[i].label} `);
    }
  }
  console.log(`Verified Entities: ${JSON.stringify(verified_response)}`);
  return verified_response;
}
/**
 *
 * This function is used to verify the entities extracted by the LLM.
 * This can be done with an entailment model trained on the ontology.
 * We are using an LLM at the moment.
 */

function verifyEntity(entity: Entity): bool {
  const description: string =
    entity.description != null ? entity.description! : "";
  const assertion = `${entity.label}, ${description} is a ${entity.is_a}.`;
  var instruction =
    `Reply 'true' or 'false' to following assertion: ` + assertion;

  const model = models.getModel<OpenAIChatModel>("llm");
  const input = model.createInput([new UserMessage(instruction)]);
  input.responseFormat = ResponseFormat.Text;
  return model
    .invoke(input)
    .choices[0].message.content.toLowerCase()
    .includes("true");
}

export function saveEntities(entity: Entity[]): string {
  return addEntities("rag/example", entity);
}

export function extractRelatedEntities(
  text: string,
  entities: Entity[],
  ontology: Ontology | null = null,
): RelatedEntity[] {
  // if not provided get the ontology from the connected Knowledge Graph
  // extractEntities can be used in a pipeline where the ontology is already loaded
  // or to test an ontology before saving it to the Knowledge Graph
  if (ontology == null) {
    ontology = getOntology();
  }
  const model = models.getModel<OpenAIChatModel>("llm");
  model.debug = MODEL_DEBUG;
  var instruction = `User submits a text. `;
  instruction += `
  Identify the following types of information:
  - Fact: something we know to be true about an entity.
  - Characteristic: a feature or quality of an entity.
  `;
  instruction += `Find only the information related to the following entities:
  LIST OF KNOWN ENTITIES:
  `;
  for (let i = 0; i < entities.length; i++) {
    instruction += `- label:${entities[i].label} is_a:${entities[i].is_a}\n`;
  }

  instruction += `Reply with a JSON document containing the list of information with the entity source using the following example.

  {
    "list": [ {"is_a": "Fact","label":"in one word what the info is about", "source": {"label": "Uranus", "is_a":"CelestialBody"}, "description": "The fact or characteristic"}]
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
  const list = JSON.parse<LAB_DGRAPH.ListOf<RelatedEntity>>(llm_response).list;

  return list;
}

export function saveRelatedEntities(entities: RelatedEntity[]): string {
  return addRelatedEntities("rag/example", entities);
}

export function analyzeRelationships(text: string): string {
  // The imported OpenAIChatModel interface follows the OpenAI chat completion model input format.
  const model = models.getModel<OpenAIChatModel>("llm");
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

export function pipeline(text: string): string {
  var status = "";
  const ontology = getOntology();
  const entities = extractEntities(text, ontology);
  // list entities in the status
  status += "Entities:\n";
  for (let i = 0; i < entities.length; i++) {
    status += `  ${entities[i].label} is a ${entities[i].is_a}\n`;
  }
  saveEntities(entities);
  const relatedEntities = extractRelatedEntities(text, entities, ontology);
  // list related entities in the status
  status += "Related Entities:\n";
  for (let i = 0; i < relatedEntities.length; i++) {
    status += `${relatedEntities[i].is_a} about ${relatedEntities[i].source.label} : ${relatedEntities[i].label}
     ${relatedEntities[i].description}\n`;
  }
  saveRelatedEntities(relatedEntities);
  return status;
}

export function suggestEntities(text: string): string {
  // The imported OpenAIChatModel interface follows the OpenAI chat completion model input format.
  const model = models.getModel<OpenAIChatModel>("llm");
  model.debug = MODEL_DEBUG;
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
