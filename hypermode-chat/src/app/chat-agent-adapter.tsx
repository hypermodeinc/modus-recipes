"use client"

import { NetworkAdapter } from "@aichatkit/network-adapter"
import { Message } from "@aichatkit/types"
import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"

export interface CustomAgentAdapterOptions {
  apolloClient: ApolloClient<NormalizedCacheObject>
  timeout?: number
  debug?: boolean
}

const CREATE_CONVERSATION_MUTATION = gql`
  mutation CreateConversation {
    createConversation
  }
`

const CONTINUE_CHAT_QUERY = gql`
  query ContinueChat($id: String!, $query: String!) {
    continueChat(id: $id, query: $query)
  }
`

const CHAT_HISTORY_QUERY = gql`
  query ChatHistory($id: String!) {
    chatHistory(id: $id)
  }
`

const DELETE_AGENT_MUTATION = gql`
  mutation DeleteAgent($id: String!) {
    deleteAgent(id: $id)
  }
`

const CLEAR_HISTORY_MUTATION = gql`
  mutation ClearHistory($id: String!) {
    clearHistory(id: $id)
  }
`

export class CustomAgentAdapter extends NetworkAdapter {
  private client: ApolloClient<NormalizedCacheObject>
  private debug: boolean

  constructor(options: CustomAgentAdapterOptions) {
    super()
    this.client = options.apolloClient
    this.debug = options.debug || false
  }

  private log(...args: any[]): void {
    if (this.debug) {
      console.log("[CustomAgentAdapter]", ...args)
    }
  }

  async startChatAgent(): Promise<string> {
    this.log("Starting new chat agent...")

    try {
      const { data } = await this.client.mutate({
        mutation: CREATE_CONVERSATION_MUTATION,
        errorPolicy: "all",
        fetchPolicy: "no-cache",
      })

      const agentId = data?.createConversation

      if (!agentId) {
        throw new Error("No agent ID returned from createConversation")
      }

      this.log("Started chat agent with ID:", agentId)
      return agentId
    } catch (error) {
      this.log("Error starting chat agent:", error)
      throw new Error(
        `Failed to start chat agent: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  async sendMessage(agentId: string, message: string): Promise<Message> {
    this.log("Sending message to agent:", agentId, "Message:", message)

    try {
      const { data } = await this.client.query({
        query: CONTINUE_CHAT_QUERY,
        variables: {
          id: agentId,
          query: message,
        },
        errorPolicy: "all",
        fetchPolicy: "no-cache",
      })

      const response = data?.continueChat

      if (!response) {
        throw new Error("No response returned from continueChat")
      }

      this.log("Received response:", response)

      const assistantMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: response,
        role: "assistant",
        timestamp: new Date().toISOString(),
      }

      return assistantMessage
    } catch (error) {
      this.log("Error sending message:", error)
      throw new Error(
        `Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  async getConversationHistory(agentId: string): Promise<Message[]> {
    this.log("Getting conversation history for agent:", agentId)

    try {
      const { data } = await this.client.query({
        query: CHAT_HISTORY_QUERY,
        variables: { id: agentId },
        errorPolicy: "all",
        fetchPolicy: "no-cache",
      })

      const historyJson = data?.chatHistory

      if (!historyJson) {
        this.log("No history returned, returning empty array")
        return []
      }

      const chatMessages = JSON.parse(historyJson)

      const messages: Message[] = chatMessages.map((msg: any, index: number) => ({
        id: `history-${index}-${Date.now()}`,
        content: msg.content || msg.Content || "",
        role: (msg.role || msg.Role || "assistant").toLowerCase() as "user" | "assistant",
        timestamp: new Date().toISOString(),
      }))

      this.log("Parsed conversation history:", messages)
      return messages
    } catch (error) {
      this.log("Error getting conversation history:", error)
      return []
    }
  }

  async clearConversationHistory(agentId: string): Promise<void> {
    this.log("Clearing conversation history for agent:", agentId)

    try {
      await this.client.mutate({
        mutation: CLEAR_HISTORY_MUTATION,
        variables: { id: agentId },
        errorPolicy: "all",
        fetchPolicy: "no-cache",
      })
    } catch (error) {
      this.log("Error clearing conversation history:", error)
      throw new Error(
        `Failed to clear conversation history: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  async stopChatAgent(agentId: string): Promise<void> {
    this.log("Stopping chat agent:", agentId)

    try {
      await this.client.mutate({
        mutation: DELETE_AGENT_MUTATION,
        variables: { id: agentId },
        errorPolicy: "all",
        fetchPolicy: "no-cache",
      })
    } catch (error) {
      this.log("Error stopping chat agent:", error)
      throw new Error(
        `Failed to stop chat agent: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  getClient(): ApolloClient<NormalizedCacheObject> {
    return this.client
  }

  async pingAgent(agentId: string): Promise<boolean> {
    try {
      await this.sendMessage(agentId, "ping")
      return true
    } catch {
      return false
    }
  }
}
