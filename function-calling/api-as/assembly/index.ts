import {
  OpenAIChatModel,
  Tool,
  SystemMessage,
  UserMessage,
  ResponseFormat,
  CompletionMessage
} from "@hypermode/modus-sdk-as/models/openai/chat";

import { models } from "@hypermode/modus-sdk-as";
const MODEL_NAME: string = "llm"; // refer to modus.json for the model specs

const DEFAULT_PROMPT = `
    You are a warehouse manager only answering questions about the stock and price of products in the warehouse.
    If you can't reply, just explain your role and expected type of questions. 
    The response should be a single sentence.
    Reply to the user question using only the data in CONTEXT. 
    """CONTEXT"""
    `

export function askQuestion(question: string, prompt:string = "" ): CompletionMessage {
  if (prompt == ""){
    prompt = DEFAULT_PROMPT
  }
  const model = models.getModel<OpenAIChatModel>(MODEL_NAME);
  console.log("Prompt :"+prompt)
  // create model input
  const input = model.createInput([
    new SystemMessage(prompt),
    new UserMessage(question),
  ]);
  input.responseFormat = ResponseFormat.Text;
  const tools = [
    tool_get_product_info(),
  ]
  input.tools = tools;
  // See https://platform.openai.com/docs/guides/function-calling for more information on how to use the tools parameter.

  input.toolChoice = "auto"; //  "auto "required" or "none" or  a function in json format

  const output = model.invoke(input);
  return output.choices[0].message
}

function tool_get_product_info(): Tool {
  const get_product_info = new Tool();
  get_product_info.function = {
    name: "get_product_info",
    description: `Get information a product in the warehouse. Call this whenever you need to know the price or stock quantity of a product.`,
    // parameters is a string that contains the JSON schema for the parameters that the tool expects.
    // valid json schema cannot have commas for the last item in an object or array
    // all object in the schema must have "additionalProperties": false
    // 'required' is required to be supplied and to be an array including every key in properties
    // meaning openai expects all fields to be required
    parameters: `{
          "type": "object",
          "properties": {
            "product_name": {
              "type": "string",
              "enum": ["Shoe", "Hat", "Trouser", "Shirt"]
            },
            "attribute": {
              "type": "string",
              "description": "The product information to return",
              "enum": ["qty", "price"]
            }
          },
          "required": ["product_name", "attribute"],
          "additionalProperties": false
        }`,

    strict: true,
  };
  return get_product_info;
}