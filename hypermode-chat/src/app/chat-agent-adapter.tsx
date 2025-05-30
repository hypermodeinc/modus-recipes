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

const CONTINUE_CHAT_MUTATION = gql`
  query ContinueChat($id: String!, $query: String!) {
    continueChat(id: $id, query: $query)
  }
`

export class CustomAgentAdapter extends NetworkAdapter {
  private client: ApolloClient<NormalizedCacheObject>
  private debug: boolean
  private agentSessions: Map<string, string> = new Map()

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

  private async startConversation(): Promise<string> {
    this.log("Starting new conversation...")

    try {
      const { data } = await this.client.mutate({
        mutation: CREATE_CONVERSATION_MUTATION,
        errorPolicy: "all",
        fetchPolicy: "no-cache",
      })

      const agentId = data?.createConversation

      if (!agentId) {
        throw new Error("No agent ID returned from startConversation")
      }

      this.log("Started conversation with agent ID:", agentId)
      return agentId
    } catch (error) {
      this.log("Error starting conversation:", error)
      throw new Error(
        `Failed to start conversation: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  private async continueChat(agentId: string, query: string): Promise<string> {
    this.log("Continuing chat with agent:", agentId, "Query:", query)

    try {
      const { data } = await this.client.query({
        query: CONTINUE_CHAT_MUTATION,
        variables: {
          id: agentId,
          query,
        },
        errorPolicy: "all",
        fetchPolicy: "no-cache",
      })

      const response = data?.continueChat

      if (!response) {
        throw new Error("No response returned from continueChat")
      }

      this.log("Received response:", response)
      return response
    } catch (error) {
      this.log("Error continuing chat:", error)
      throw new Error(
        `Failed to continue chat: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  async sendMessage(message: string, conversationId: string, history?: string): Promise<Message> {
    this.log("Sending message for conversation:", conversationId, "Message:", message)

    try {
      let agentId = this.agentSessions.get(conversationId)

      if (!agentId) {
        this.log(`No existing agent session for conversation ${conversationId}, starting new one`)

        agentId = await this.startConversation()

        this.agentSessions.set(conversationId, agentId)
        this.log(`Mapped conversation ${conversationId} to agent ${agentId}`)
      } else {
        this.log(`Using existing agent ${agentId} for conversation ${conversationId}`)
      }

      const response = await this.continueChat(agentId, message)

      const assistantMessage: Message = {
        id: Date.now(),
        content: response,
        role: "assistant",
        timestamp: new Date().toISOString(),
      }

      this.log("Returning assistant message:", assistantMessage)
      return assistantMessage
    } catch (error) {
      this.log("Error in sendMessage:", error)

      this.agentSessions.delete(conversationId)

      throw error
    }
  }

  public cleanupConversation(conversationId: string): void {
    const agentId = this.agentSessions.get(conversationId)
    this.agentSessions.delete(conversationId)
    this.log(`Cleaned up agent session for conversation ${conversationId} (agent: ${agentId})`)
  }

  public getActiveSessions(): Record<string, string> {
    return Object.fromEntries(this.agentSessions)
  }

  public async resetConversation(conversationId: string): Promise<void> {
    const oldAgentId = this.agentSessions.get(conversationId)

    this.cleanupConversation(conversationId)

    this.log(
      `Reset conversation ${conversationId} (old agent: ${oldAgentId}) - new agent will be created on next message`,
    )
  }

  public getAgentId(conversationId: string): string | undefined {
    return this.agentSessions.get(conversationId)
  }

  public hasActiveSession(conversationId: string): boolean {
    return this.agentSessions.has(conversationId)
  }

  public clearAllSessions(): void {
    const sessionCount = this.agentSessions.size
    this.agentSessions.clear()
    this.log(`Cleared all ${sessionCount} agent sessions`)
  }
}
