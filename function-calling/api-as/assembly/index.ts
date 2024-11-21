import {
  OpenAIChatModel,
  Tool,
  ToolCall,
  SystemMessage,
  UserMessage,
  ToolMessage,
  ResponseFormat,
  CompletionMessage
} from "@hypermode/modus-sdk-as/models/openai/chat";
import { EnumParam,StringParam, ObjectParam } from "./params";
import { get_product_info, get_product_types } from "./warehouse";
import { models } from "@hypermode/modus-sdk-as";
import { JSON } from "json-as";

const MODEL_NAME: string = "llm"; // refer to modus.json for the model specs

const DEFAULT_PROMPT = `
    You are a warehouse manager only answering questions about the stock and price of products in the warehouse.
    If you can't reply, try to use one of the tool to get additional information. 
    If no tool can help, just explain your role and expected type of questions. 
    The response should be a single sentence.
    Reply to the user question using only the data provided by tools. 
    If you have a doubt about a product, use the tool to get the list of product names.

    `
@json
class ResponseWithLogs {
  response: string = "";
  logs: string[] = [];
}
export function askQuestionToWarehouse(question: string): ResponseWithLogs {
  
  const model = models.getModel<OpenAIChatModel>(MODEL_NAME);
  var logs :string[]=[]
  var final_response = ""
  var tool_messages :ToolMessage[] = []
  var message: CompletionMessage | null = null
  var loops = 0
  // we loop until we get a response or we reach the maximum number of loops (3)
  do {
    message = getLLMResponse(model, question, message, tool_messages)
    /* do we have a tool call to execute */
    if (message.toolCalls.length > 0){
      for (var i = 0; i < message.toolCalls.length; i++) {
        logs.push(`Calling function : ${message.toolCalls[i].function.name} with ${message.toolCalls[i].function.arguments}`)
      }
      
      tool_messages = aggregateToolsResponse(message.toolCalls)
      for (i = 0; i < tool_messages.length; i++) {
        logs.push(`Tool response    : ${tool_messages[i].content}`)
      }
    }  else {
      final_response = message.content;
      break;
    }
  } while (loops++ < 2)

  return {response: final_response, logs: logs}
}

/**
 * Execute the tool calls and return an array of ToolMessage
 * containing the response of the tools
 */
function aggregateToolsResponse(toolCalls: ToolCall[]): ToolMessage[] {
  var messages :ToolMessage[] = []
  for (var i = 0; i < toolCalls.length; i++) {
    const content = executeToolCall(toolCalls[i])
    const toolCallResponse = new ToolMessage(content,toolCalls[i].id)
    messages.push(toolCallResponse)
  }
  return messages
}

function executeToolCall(toolCall: ToolCall): string {
  if (toolCall.function.name == "get_product_list") {
    return get_product_types()
  } else if (toolCall.function.name == "get_product_info") {
    return get_product_info(toolCall.function.arguments)
  } else {  
    return ""
  }
}

function getLLMResponse(model: OpenAIChatModel, question: string, last_message: CompletionMessage| null = null, tools_messages: ToolMessage[] = [] ): CompletionMessage {

  const input = model.createInput([
    new SystemMessage(DEFAULT_PROMPT),
    new UserMessage(question),
  ]);
  /*
  * adding tools messages (response from tools) to the input
  * first we need to add the last completion message so the LLM can match the tool messages with the tool call 
  */
  if (last_message != null) {
    input.messages.push(last_message)
  }
  for (var i = 0; i < tools_messages.length; i++) {
    input.messages.push(tools_messages[i])
  }
  
  input.responseFormat = ResponseFormat.Text;
  const tools = [
    tool_get_product_list(),
    tool_get_product_info()
  ]
  input.tools = tools;

  input.toolChoice = "auto"; //  "auto "required" or "none" or  a function in json format

  const message = model.invoke(input).choices[0].message
  return message
}

/**
 * Creates a Tool object that can be used to call the get_product_info function in the warehouse.
 * @returns Tool
 * set good function and parameter description to help the LLM understand the tool
 */
function tool_get_product_info(): Tool {
  const get_product_info = new Tool();
  const param = new ObjectParam();
  
  //param.addRequiredProperty("product_name", new EnumParam(["Shoe", "Hat", "Trouser", "Shirt"],"One of the product in the warehouse."));
  param.addRequiredProperty("product_name", new StringParam("One of the product in the warehouse like 'Shoe' or  'Hat'."));
  
  param.addRequiredProperty("attribute", new EnumParam(["qty", "price"],"The product information to return"));

  get_product_info.function = {
    name: "get_product_info",
    description: `Get information a product in the warehouse. Call this whenever you need to know the price or stock quantity of a product.`,
    // parameters is a string that contains the JSON schema for the parameters that the tool expects.
    // valid json schema cannot have commas for the last item in an object or array
    // all object in the schema must have "additionalProperties": false
    // 'required' is required to be supplied and to be an array including every key in properties
    // meaning openai expects all fields to be required
    parameters: param.toString(),
    strict: true,
  };
  
  return get_product_info;
}

/**
 * Creates a Tool object that can be used to call the get_product_list function in the warehouse.
 * @returns Tool
 * set good function and parameter description to help the LLM understand the tool
 */
function tool_get_product_list(): Tool {
  const get_product_list = new Tool();
  /* this function has no parameters */
  get_product_list.function = {
    name: "get_product_list",
    description: `Get the list of product names in the warehouse. Call this whenever you need to know which product you are able to get information about.`,
    parameters: null,
    strict: false
  };
  
  return get_product_list;
}



