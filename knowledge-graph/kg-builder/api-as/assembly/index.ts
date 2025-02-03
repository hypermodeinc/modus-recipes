import { CsvSpec } from "./classes";
import {
  GraphModel,
  Entity,
  Attribute,
  AttributeType,
  Relationship,
} from "./graph-model";
import { models } from "@hypermode/modus-sdk-as";
import { JSON } from "json-as";
import {
  OpenAIChatModel,
  ResponseFormat,
  SystemMessage,
  UserMessage,
} from "@hypermode/modus-sdk-as/models/openai/chat";

export function sayHello(name: string | null = null): string {
  return `Hello, ${name || "World"}!`;
}

const sampleGraphModel = JSON.stringify(<GraphModel>{
  entities: [
    {
      name: "name of the entity",
      attributes: [
        {
          name: "id",
          description: "",
          type: "string | number | boolean | date | geo",
        },
        {
          name: "name",
          description: "",
          type: "string | number | boolean | date | geo",
        },
      ],
    },
  ],
  relationships: [],
});

export function inferGraphModel(input: CsvSpec[]): GraphModel {
  var prompt =
    "Generate JSON document describing the entities, relationship and attributes based on the provided CSV specifications.";
  prompt += `Here is an example of JSON output:  ${sampleGraphModel} \n`;
  prompt += `The description must explain for the attribute semantically relates to the entity.\n`;
  prompt += `The final result is just the naked json document, no need to wrap it in a code block.`;
  prompt += `\nFiles and columns available: `;
  for (let i = 0; i < input.length; i++) {
    const csvSpec = input[i];
    prompt += `
    file name: ${csvSpec.fileName}, 
    header structure: ${csvSpec.headerStructure}, 
    row example: ${csvSpec.rowExample}. 
    `;
  }

  const generated = generateText(null, prompt);
  console.log(generated.thinkingProcess!);
  console.log(generated.text);
  var json_string = generated.text;
  if (generated.text.indexOf("```json") !== -1) {
    json_string = generated.text.slice(
      generated.text.indexOf("```json") + 7,
      generated.text.indexOf("````"),
    );
  }
  return JSON.parse<GraphModel>(json_string);
}

function inferAttributeType(value: string): AttributeType {
  if (value === "true" || value === "false") {
    return AttributeType.BOOLEAN;
  }

  return AttributeType.STRING;
}
const sampleMapping = `
<_:U_[twitch_id]> <dgraph.type> "User" .
<_:U_[twitch_id]> <xid> "_:U_[twitch_id]" .
<_:U_[twitch_id]> <User.broadcaster_type> "[broadcaster_type]" .
<_:U_[twitch_id]> <User.display_name> "[display_name]" .
<_:U_[twitch_id]> <User.profile_url> "[profile_url]" .
<_:U_[twitch_id]> <User.followers> "[followers]" .
`;
export function inferMapping(input: CsvSpec[], schema: string): string {
  var prompt = "Produce a template file used to generate RDF from CSV files.";
  prompt += `Here is an example of output:  ${sampleMapping} \n`;
  prompt += `The goal is to populate the graph described by the graph model ${schema}.\n`;
  prompt += `for each entity to create use the following pattern: \n`;
  prompt += `<enityname:[identifier column]> <dgraph.type> "entity name" .\n`;
  prompt += `<entityname:[identifier column]> <identifier attribute> "[idenfifier column]" .\n`;
  prompt += `for each attribute to create use the following pattern: \n`;
  prompt += `<enityname:[identifier column]> <entity name.attribute name> "[attribute column]" .\n`;
  prompt += `For each relationship to create use the following pattern: \n`;
  prompt += `<entityname:[identifier column]> <relationship name> <other entity name:[identifier column]> .\n`;
  prompt += `\nFiles and columns available: `;
  for (let i = 0; i < input.length; i++) {
    const csvSpec = input[i];
    prompt += `
    file name: ${csvSpec.fileName}, 
    header structure: ${csvSpec.headerStructure}, 
    row example: ${csvSpec.rowExample}. 
    `;
  }

  const generated = generateText(null, prompt);
  console.log(generated.thinkingProcess!);
  console.log(generated.text);
  return generated.text;
}

/**
 * Use our LLM to generate text based on an instruction and prompt
 */
class TextGenerationOutput {
  text!: string;
  thinkingProcess: string | null = null;
}
function generateText(
  instruction: string | null,
  prompt: string,
): TextGenerationOutput {
  const model = models.getModel<OpenAIChatModel>("text-generator");

  const input = model.createInput([]);
  if (instruction != null) {
    input.messages.push(new SystemMessage(instruction));
  }
  input.messages.push(new UserMessage(prompt));

  input.temperature = 0.4;
  input.responseFormat = ResponseFormat.Json;
  const output = model.invoke(input);
  const text_output = output.choices[0].message.content.trim();

  // extract the thinking process between <think> and </think> tags ( DeepSeek)
  const thinkingProcess = text_output.slice(
    text_output.indexOf("<think>") + 7,
    text_output.indexOf("</think>"),
  );
  // response is after </thin> tag
  const text = text_output.slice(text_output.indexOf("</think>") + 8);
  return { text, thinkingProcess };
}
