"use client"

import { useState, FormEvent, useRef, useEffect } from "react"
import { PaperPlaneTilt, Plus, Trash } from "@phosphor-icons/react"
import { motion } from "framer-motion"
import Button from "./button"
import { Input } from "./input"
import { chat, Message } from "@/app/action"

const LoadingDot = ({ delay }: { delay: number }) => (
  <motion.div
    className="w-2 h-2 bg-neutral-600 rounded-full"
    animate={{
      y: ["0%", "-50%", "0%"],
    }}
    transition={{
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut",
      delay: delay,
    }}
  />
)

export const LoadingChatBubble: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-start"
    >
      <div className="relative max-w-[85%] px-4 py-3 bg-neutral-100 text-text-primary rounded-[1.15rem] rounded-bl-none">
        <div className="flex space-x-1">
          <LoadingDot delay={0} />
          <LoadingDot delay={0.2} />
          <LoadingDot delay={0.4} />
        </div>
      </div>
    </motion.div>
  )
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
}

export default function ChatInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "Conversation 1",
      messages: [{ id: 1, content: "Hello! How can I help you today?", role: "assistant" }],
    },
  ])
  const [currentConversationId, setCurrentConversationId] = useState("1")
  const [input, setInput] = useState("")
  const [userpref, setUserpref] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentConversation = conversations.find((c) => c.id === currentConversationId)
  const messages = currentConversation?.messages || []

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  const createNewConversation = () => {
    const newId = (conversations.length + 1).toString()
    const newConversation: Conversation = {
      id: newId,
      title: "Conversation " + newId,
      messages: [{ id: 1, content: "Hello! How can I help you today?", role: "assistant" }],
    }
    setConversations((prev) => [...prev, newConversation])
    setCurrentConversationId(newId)
  }

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id))
    if (id === currentConversationId) {
      const remainingConvs = conversations.filter((conv) => conv.id !== id)
      if (remainingConvs.length > 0) {
        setCurrentConversationId(remainingConvs[0].id)
      } else {
        createNewConversation()
      }
    }
  }

  const fetchResponse = async (input: string) => {
    const response = await chat(input, messages.slice(1, -1), userpref)
    {
      console.info("Chat response received:", {
        error: response.error,
        message: response.data?.chat?.message,
        userPreferences: response.data?.user_preferences,
      })
      if (response.error) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConversationId
              ? {
                  ...conv,
                  messages: [
                    ...conv.messages,
                    {
                      id: conv.messages.length + 1,
                      content: "Sorry, I didn't catch that.",
                      role: "assistant",
                    },
                  ],
                }
              : conv,
          ),
        )
      } else {
        setUserpref(response.data.user_preferences)
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConversationId
              ? {
                  ...conv,
                  messages: [
                    ...conv.messages,
                    {
                      id: conv.messages.length + 1,
                      content: response.data.chat.message,
                      role: "assistant",
                    },
                  ],
                }
              : conv,
          ),
        )
      }
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (input) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId
            ? {
                ...conv,
                messages: [
                  ...conv.messages,
                  {
                    id: conv.messages.length + 1,
                    content: input,
                    role: "user",
                  },
                ],
              }
            : conv,
        ),
      )
      setLoading(true)
      setInput("")
      await fetchResponse(input)
    }
  }

  return (
    <div className="h-full flex bg-white">
      {/* Left Panel */}
      <div className="w-64 bg-modal-surface-body-primary border-r border-border-primary p-4">
        <Button
          onClick={createNewConversation}
          className="w-full mb-4 flex items-center justify-center gap-2"
        >
          <Plus size={20} weight="light" />
          New Conversation
        </Button>
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div key={conv.id} className="flex items-center gap-2">
              <button
                onClick={() => setCurrentConversationId(conv.id)}
                className={`flex-1 p-2 text-left rounded-lg transition-colors ${
                  conv.id === currentConversationId
                    ? "bg-primary-300 text-text-inverse"
                    : "hover:bg-neutral-100"
                }`}
              >
                {conv.title}
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteConversation(conv.id)}
                className="opacity-50 hover:opacity-100"
              >
                <Trash size={16} weight="light" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="p-4 shadow-xs bg-white">
          <h1 className="font-alliance text-2xl font-bold text-center text-text-primary">
            Hypermode Chat
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`relative max-w-[85%] px-4 py-2 ${
                  message.role === "user"
                    ? "bg-primary-300 text-text-inverse rounded-[1.15rem] rounded-br-none"
                    : "bg-neutral-100 text-text-primary rounded-[1.15rem] rounded-bl-none"
                }`}
              >
                {message.content}
              </div>
            </motion.div>
          ))}
          {loading && <LoadingChatBubble />}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="p-8 border-t border-border-primary bg-white">
          <div className="flex items-center gap-4 pb-10">
            <Input
              type="text"
              value={input}
              className="h-16"
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
            />
            <Button type="submit" disabled={loading}>
              <PaperPlaneTilt size={20} weight="light" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
