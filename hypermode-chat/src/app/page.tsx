"use client"

import React, { useEffect, useState } from "react"
import { ChatInterface, Avatar } from "@aichatkit/ui"
import { Conversation } from "@aichatkit/types"
import { PlusIcon, SendIcon, XIcon } from "lucide-react"
import { useApolloClient } from "@apollo/client"
import { ApolloAdapter } from "@aichatkit/apollo-adapter"
import { LocalStorageAdapter } from "@aichatkit/localstorage-adapter"

const formatTimestamp = () => {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

const initialConversations: Conversation[] = [
  {
    id: "1",
    title: "New Chat",
    messages: [
      {
        id: "1",
        content: "Hello! How can I help you today?",
        role: "assistant" as const,
        timestamp: formatTimestamp(),
      },
    ],
  },
]

export default function HypermodeChatDemo() {
  const apolloClient = useApolloClient()
  const [networkAdapter, setNetworkAdapter] = useState<ApolloAdapter | null>(null)
  const [storageAdapter, setStorageAdapter] = useState<LocalStorageAdapter | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const initAdapters = async () => {
      try {
        // @ts-ignore
        const apolloAdapter = new ApolloAdapter({ apolloClient })
        const localStorageAdapter = new LocalStorageAdapter({})
        await localStorageAdapter.initialize()

        setNetworkAdapter(apolloAdapter)
        setStorageAdapter(localStorageAdapter)
        setReady(true)
      } catch (error) {
        console.error("Error initializing adapters:", error)
      }
    }

    initAdapters()
  }, [apolloClient])

  if (!ready) {
    return (
      <div className="h-screen w-screen bg-hypermode-bg text-white flex items-center justify-center">
        <div className="text-lg">Loading chat interface...</div>
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
        assistantAvatar={<Avatar initial="H" hypermodeStyle={true} />}
        chatAreaClassName="hypermode-scrollbar"
        headerContent={
          <div className="flex items-center justify-between p-3 border-b border-hypermode-border">
            <div className="flex items-center">
              <Avatar initial="H" hypermodeStyle={true} />
              <span className="ml-2 font-medium">Hypermode Assistant</span>
            </div>
          </div>
        }
      />
    </div>
  )
}
