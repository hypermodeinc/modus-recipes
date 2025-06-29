"use client"

import React, { useEffect, useState } from "react"
import { ChatInterface, Avatar } from "@aichatkit/ui"
import { CardAction } from "@aichatkit/types"
import { PlusIcon, SendIcon, XIcon } from "lucide-react"
import { useApolloClient } from "@apollo/client"
import { LocalStorageAdapter } from "@aichatkit/localstorage-adapter"
import { ApolloAdapter } from "@aichatkit/apollo-adapter"

export default function HypermodeChatDemo() {
  const apolloClient = useApolloClient()
  const [networkAdapter, setNetworkAdapter] = useState<ApolloAdapter | null>(null)
  const [storageAdapter, setStorageAdapter] = useState<LocalStorageAdapter | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initAdapters = async () => {
      try {
        // Use the standard ApolloAdapter from ChatKit
        const apolloAdapter = new ApolloAdapter({
          // @ts-expect-error - need to make apollo a peer dependency
          apolloClient,
        })

        const localStorageAdapter = new LocalStorageAdapter({})
        await localStorageAdapter.initialize()

        // Set up network callbacks for backend synchronization
        localStorageAdapter.setNetworkCallbacks({
          getConversationItems: (agentId: string) => apolloAdapter.getConversationItems(agentId),
          clearConversationHistory: (agentId: string) =>
            apolloAdapter.clearConversationHistory(agentId),
        })

        setNetworkAdapter(apolloAdapter)
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

  const handleCardAction = (action: CardAction) => {
    console.log("Card action triggered:", action)

    switch (action.action) {
      case "show_facts":
        // Handle showing all facts
        alert(`Showing all facts: ${JSON.stringify(action.data, null, 2)}`)
        break
      case "search_entity":
        // Handle entity search
        alert(`Searching for entity: ${action.data?.entity}`)
        break
      case "view_details":
        // Handle viewing fact details
        alert(`Viewing details for: ${action.data?.fact}`)
        break
      default:
        if (action.type === "link") {
          window.open(action.action, "_blank")
        } else {
          console.log("Unhandled card action:", action)
        }
    }
  }

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
        networkAdapter={networkAdapter!}
        storageAdapter={storageAdapter!}
        showSidebar={true}
        hypermodeStyle={true}
        className="h-full"
        sendButtonIcon={<SendIcon size={18} />}
        newConversationIcon={<PlusIcon size={18} />}
        deleteConversationIcon={<XIcon size={16} />}
        userAvatar={<Avatar initial="U" role="user" hypermodeStyle={true} />}
        assistantAvatar={<Avatar initial="A" hypermodeStyle={true} />}
        inputPlaceholder="Ask me to remember facts or search for information..."
        chatAreaClassName="hypermode-scrollbar"
        onCardAction={handleCardAction}
        headerContent={
          <div className="flex items-center justify-between border-hypermode-border border-b p-3">
            <div className="flex items-center">
              <Avatar initial="A" hypermodeStyle={true} />
              <span className="ml-2 font-medium">Knowledge Agent</span>
            </div>
          </div>
        }
        sidebarHeaderContent={
          <div className="p-3 border-b border-hypermode-border">
            <div className="text-center">
              <div className="text-lg font-semibold">Knowledge Chat</div>
              <div className="text-xs text-neutral-400 mt-1">Powered by Hypermode Agents</div>
            </div>
          </div>
        }
      />
    </div>
  )
}
