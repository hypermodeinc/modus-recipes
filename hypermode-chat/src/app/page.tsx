"use client"

import React, { useEffect, useState } from "react"
import { ChatInterface, Avatar } from "@aichatkit/ui"
import { Conversation } from "@aichatkit/types"
import { PlusIcon, SendIcon, XIcon } from "lucide-react"
import { useApolloClient } from "@apollo/client"
import { LocalStorageAdapter } from "@aichatkit/localstorage-adapter"
import { CustomAgentAdapter } from "./chat-agent-adapter"

const formatTimestamp = () => {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

const initialConversations: Conversation[] = [
  {
    id: "1",
    title: "New Agent Chat",
    messages: [
      {
        id: "1",
        content:
          "Hello! I'm your AI assistant powered by a Hypermode agent backend. I can remember our conversation and help you with various tasks. How can I assist you today?",
        role: "assistant" as const,
        timestamp: formatTimestamp(),
      },
    ],
  },
]

export default function HypermodeChatDemo() {
  const apolloClient = useApolloClient()
  const [networkAdapter, setNetworkAdapter] = useState<CustomAgentAdapter | null>(null)
  const [storageAdapter, setStorageAdapter] = useState<LocalStorageAdapter | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initAdapters = async () => {
      try {
        const agentAdapter = new CustomAgentAdapter({
          // @ts-ignore
          apolloClient: apolloClient,
          debug: process.env.NODE_ENV === "development",
        })

        const localStorageAdapter = new LocalStorageAdapter({})
        await localStorageAdapter.initialize()

        localStorageAdapter.setNetworkCallbacks({
          getConversationHistory: (agentId: string) => agentAdapter.getConversationHistory(agentId),
          clearConversationHistory: (agentId: string) =>
            agentAdapter.clearConversationHistory(agentId),
        })

        setNetworkAdapter(agentAdapter)
        setStorageAdapter(localStorageAdapter)
        setReady(true)
        setError(null)
      } catch (error) {
        console.error("Error initializing adapters:", error)
        setError(error instanceof Error ? error.message : "Failed to initialize adapters")
      }
    }

    initAdapters()
  }, [apolloClient])

  if (error) {
    return (
      <div className="h-screen w-screen bg-hypermode-bg text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-lg text-red-400 mb-4">Connection Error</div>
          <div className="text-sm text-neutral-400 mb-4">{error}</div>
          <div className="text-xs text-neutral-500 mb-4">
            Make sure your agent backend is running at the configured endpoint.
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-hypermode-accent rounded-md hover:bg-hypermode-accent-light transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="h-screen w-screen bg-hypermode-bg text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-2">Connecting to Agent Backend...</div>
          <div className="text-sm text-neutral-400">Initializing chat interface</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-hypermode-bg text-white overflow-hidden">
      <ChatInterface
        initialConversations={initialConversations}
        showSidebar={true}
        hypermodeStyle={true}
        className="h-full"
        networkAdapter={networkAdapter!}
        storageAdapter={storageAdapter!}
        sendButtonIcon={<SendIcon size={18} />}
        newConversationIcon={<PlusIcon size={18} />}
        deleteConversationIcon={<XIcon size={16} />}
        userAvatar={<Avatar initial="U" role="user" hypermodeStyle={true} />}
        assistantAvatar={<Avatar initial="A" hypermodeStyle={true} />}
        chatAreaClassName="hypermode-scrollbar"
        // headerContent={
        //  <></>
        // }
        sidebarHeaderContent={
          <div className="p-3 border-b border-hypermode-border">
            <div className="text-center">
              <div className="text-lg font-semibold">Agent Chat</div>
              <div className="text-xs text-neutral-400 mt-1">Powered by Hypermode Agents</div>
            </div>
          </div>
        }
      />
    </div>
  )
}
