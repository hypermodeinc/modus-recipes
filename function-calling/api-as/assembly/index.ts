import {
  OpenAIChatModel,
  Tool,
  ToolCall,
  SystemMessage,
  UserMessage,
  ResponseFormat,
  CompletionMessage
} from "@hypermode/modus-sdk-as/models/openai/chat";

import { models } from "@hypermode/modus-sdk-as";

import { JSON } from "json-as";

const MODEL_NAME: string = "llm"; // refer to modus.json for the model specs

const DEFAULT_PROMPT = `
    You are a warehouse manager only answering questions about the stock and price of products in the warehouse.
    If you can't reply, just explain your role and expected type of questions. 
    The response should be a single sentence.
    Reply to the user question using only the data in CONTEXT. 
    """CONTEXT"""
    `

export function askQuestionToWarehouse(question: string): string {
  
  const model = models.getModel<OpenAIChatModel>(MODEL_NAME);
  var context = ""
  var response = "No response"
  var loops = 0
  do {
    const message = getLLMResponse(model, question, context)
    console.log(`Message: ${JSON.stringify(message)}`)
    if (message.toolCalls.length > 0){
      context = aggregateToolsResponse(message.toolCalls)
      console.log(`Context: ${context}`)
    }  else {
      response = message.content
      break;
    }
  } while (loops++ < 2)

  return response
}
@json
class GetProductArguments { 
  product_name: string="";
  attribute: string="";
}

function aggregateToolsResponse(toolCalls: ToolCall[]): string {
  var responses = []
  for (var i = 0; i < toolCalls.length; i++) {
      responses.push(executeToolCall(toolCalls[i]))
  }
  return responses.join("\n")
}

function executeToolCall(toolCall: ToolCall): string {
  if (toolCall.function.name == "get_product_info") {
    const args = JSON.parse<GetProductArguments>(toolCall.function.arguments)
    return `The ${args.attribute} of ${args.product_name} is 10. `
  }
  return ""
}

function getLLMResponse(model: OpenAIChatModel, question: string, context:string ="" ): CompletionMessage {
  const input = model.createInput([
    new SystemMessage(DEFAULT_PROMPT+context),
    new UserMessage(question),
  ]);
  
  input.responseFormat = ResponseFormat.Text;
  const tools = [
    tool_get_product_info(),
  ]
  input.tools = tools;

  input.toolChoice = "auto"; //  "auto "required" or "none" or  a function in json format

  const message = model.invoke(input).choices[0].message
  return message
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