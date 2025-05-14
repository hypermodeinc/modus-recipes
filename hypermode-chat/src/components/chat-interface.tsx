"use client"

import { useState, FormEvent, useRef, useEffect } from "react"
import { PaperPlaneTilt } from "@phosphor-icons/react"
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

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, content: "Hello! How can I help you today?", role: "assistant" },
  ])
  const [input, setInput] = useState("")
  const [userpref, setUserpref] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])
  const fetchResponse = async (input: string) => {
    const response = await chat(input, messages.slice(1, -1), userpref)
    {
      console.info("Chat response received:", {
        error: response.error,
        message: response.data?.chat?.message,
        userPreferences: response.data?.user_preferences,
      });
      if (response.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            content: "Sorry, I didn't catch that.",
            role: "assistant",
          },
        ])
      } else {
        setUserpref(response.data.user_preferences)
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            content: response.data.chat.message,
            role: "assistant",
          },
        ])
      }
      setLoading((prev) => false)
    }
  }
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (input) {
      setMessages((prev) => [...prev, { id: prev.length + 1, content: input, role: "user" }]) // Add user message to chat
      setLoading((prev) => true)
      setInput("")
      await fetchResponse(input)
    }
  }

  return (
    <div className="h-full rounded-lg flex flex-col mx-auto bg-linear-to-b from-gray-50 to-gray-100 shadow-xl">
      <div className="bg-modal-surface-body-primary p-4 shadow-xs rounded-t-lg">
        <h1 className="font-alliance text-2xl font-bold text-center text-text-primary">
          Hypermode Chat
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
      <form
        onSubmit={handleSubmit}
        className="p-8 bg-modal-surface-body-primary border-t border-border-primary rounded-b-lg"
      >
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
  )
}
