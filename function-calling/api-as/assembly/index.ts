import {
  OpenAIChatModel,
  Tool,
  ToolCall,
  SystemMessage,
  UserMessage,
  ToolMessage,
  ResponseFormat,
  CompletionMessage,
} from "@hypermode/modus-sdk-as/models/openai/chat"
import { EnumParam, StringParam, ObjectParam } from "./params"
import { get_product_info, get_product_types } from "./warehouse"
import { models } from "@hypermode/modus-sdk-as"
import { llmWithTools, ResponseWithLogs } from "./tool-helper"
import { JSON } from "json-as"

const MODEL_NAME: string = "llm" // refer to modus.json for the model specs

const DEFAULT_PROMPT = `
    You are a warehouse manager only answering questions about the stock and price of products in the warehouse.
    If you can't reply, try to use one of the tool to get additional information. 
    If no tool can help, just explain your role and expected type of questions. 
    The response should be a single sentence.
    Reply to the user question using only the data provided by tools. 
    If you have a doubt about a product, use the tool to get the list of product names.

    `
/**
 * Ask a natural language question to the warehouse, for example try asking about items that are in stock in the warehouse
 */
export function askQuestionToWarehouse(question: string): ResponseWithLogs {
  const model = models.getModel<OpenAIChatModel>(MODEL_NAME)
  const loop_limit: u8 = 3 // maximum number of loops
  return llmWithTools(
    model,
    [tool_get_product_list(), tool_get_product_info()],
    DEFAULT_PROMPT,
    question,
    executeToolCall,
    loop_limit,
  )
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

/**
 * Creates a Tool object that can be used to call the get_product_info function in the warehouse.
 * @returns Tool
 * set good function and parameter description to help the LLM understand the tool
 */
function tool_get_product_info(): Tool {
  const get_product_info = new Tool()
  const param = new ObjectParam()

  //param.addRequiredProperty("product_name", new EnumParam(["Shoe", "Hat", "Trouser", "Shirt"],"One of the product in the warehouse."));
  param.addRequiredProperty(
    "product_name",
    new StringParam("One of the product in the warehouse like 'Shoe' or  'Hat'."),
  )

  param.addRequiredProperty(
    "attribute",
    new EnumParam(["qty", "price"], "The product information to return"),
  )

  get_product_info.function = {
    name: "get_product_info",
    description: `Get information a product in the warehouse. Call this whenever you need to know the price or stock quantity of a product.`,
    // parameters is a string that contains the JSON schema for the parameters that the tool expects.
    // valid json schema cannot have commas for the last item in an object or array
    // all object in the schema must have "additionalProperties": false
    // 'required' is required to be supplied and to be an array including every key in properties
    // meaning openai expects all fields to be required
    parameters: JSON.Raw.from(param.toString()),
    strict: true,
  }

  return get_product_info
}

/**
 * Creates a Tool object that can be used to call the get_product_list function in the warehouse.
 * @returns Tool
 * set good function and parameter description to help the LLM understand the tool
 */
function tool_get_product_list(): Tool {
  const get_product_list = new Tool()
  /* this function has no parameters */
  get_product_list.function = {
    name: "get_product_list",
    description: `Get the list of product names in the warehouse. Call this whenever you need to know which product you are able to get information about.`,
    parameters: null,
    strict: false,
  }

  return get_product_list
}
