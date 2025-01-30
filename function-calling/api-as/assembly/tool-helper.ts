import {
  OpenAIChatModel,
  Tool,
  ToolCall,
  SystemMessage,
  UserMessage,
  ToolMessage,
  ResponseFormat,
  CompletionMessage,
  ToolChoice,
} from "@hypermode/modus-sdk-as/models/openai/chat"

/**
 * Final response and log of each prompt iteration with tool use
 */
@json
export class ResponseWithLogs {
  response: string = ""
  logs: string[] = []
}

export function llmWithTools(
  model: OpenAIChatModel,
  tools: Tool[],
  system_prompt: string,
  question: string,
  toolCallBack: (toolCall: ToolCall) => string,
  limit: u8 = 3,
): ResponseWithLogs {
  var logs: string[] = []
  var final_response = ""
  var tool_messages: ToolMessage<string>[] = []
  var message: CompletionMessage | null = null
  var loops: u8 = 0
  // we loop until we get a response or we reach the maximum number of loops (3)
  do {
    message = getLLMResponse(model, tools, system_prompt, question, message, tool_messages)
    /* do we have a tool call to execute */
    if (message.toolCalls.length > 0) {
      for (let i = 0; i < message.toolCalls.length; i++) {
        logs.push(
          `Calling function : ${message.toolCalls[i].function.name} with ${message.toolCalls[i].function.arguments}`,
        )
      }
      tool_messages = aggregateToolsResponse(message.toolCalls, toolCallBack)
      for (let i = 0; i < tool_messages.length; i++) {
        logs.push(`Tool response    : ${tool_messages[i].content}`)
      }
    } else {
      final_response = message.content
      break
    }
  } while (loops++ < limit - 1)

  return { response: final_response, logs: logs }
}

function getLLMResponse(
  model: OpenAIChatModel,
  tools: Tool[],
  system_prompt: string,
  question: string,
  last_message: CompletionMessage | null = null,
  tools_messages: ToolMessage<string>[] = [],
): CompletionMessage {
  const input = model.createInput([new SystemMessage(system_prompt), new UserMessage(question)])
  /*
   * adding tools messages (response from tools) to the input
   * first we need to add the last completion message so the LLM can match the tool messages with the tool call
   */
  if (last_message != null) {
    input.messages.push(last_message.toAssistantMessage())
  }
  for (var i = 0; i < tools_messages.length; i++) {
    input.messages.push(tools_messages[i])
  }

  input.responseFormat = ResponseFormat.Text
  input.tools = tools

  input.toolChoice = ToolChoice.Auto //  Auto, Required, None, or Function("name")

  const message = model.invoke(input).choices[0].message
  return message
}

/**
 * Execute the tool calls and return an array of ToolMessage
 * containing the response of the tools
 */
function aggregateToolsResponse(
  toolCalls: ToolCall[],
  toolCallBack: (toolCall: ToolCall) => string,
): ToolMessage<string>[] {
  var messages: ToolMessage<string>[] = []
  for (let i = 0; i < toolCalls.length; i++) {
    const content = toolCallBack(toolCalls[i])
    const toolCallResponse = new ToolMessage(content, toolCalls[i].id)
    messages.push(toolCallResponse)
  }
  return messages
}
