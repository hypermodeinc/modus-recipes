"use client"

import { createClient, Provider, cacheExchange, fetchExchange, subscriptionExchange } from "urql"

const modusSSEExchange = subscriptionExchange({
  forwardSubscription(request) {
    return {
      subscribe(sink) {
        const controller = new AbortController()

        const runSubscription = async () => {
          try {
            const response = await fetch("http://localhost:8686/graphql", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "text/event-stream",
              },
              body: JSON.stringify({
                query: request.query,
                variables: request.variables,
              }),
              signal: controller.signal,
            })

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const reader = response.body?.getReader()
            if (!reader) {
              throw new Error("No response body")
            }

            const decoder = new TextDecoder()
            let buffer = ""

            while (true) {
              const { done, value } = await reader.read()

              if (done) break

              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split("\n")

              // Keep the last incomplete line in the buffer
              buffer = lines.pop() || ""

              let currentEvent = ""
              let currentData = ""

              for (const line of lines) {
                if (line.startsWith("event: ")) {
                  currentEvent = line.slice(7).trim()
                } else if (line.startsWith("data: ")) {
                  currentData = line.slice(6)
                } else if (line === "") {
                  // End of event - process if it's a "next" event with data
                  if (currentEvent === "next" && currentData) {
                    try {
                      const parsedData = JSON.parse(currentData)
                      console.log("Received subscription data:", parsedData)
                      sink.next(parsedData)
                    } catch (error) {
                      console.error("Failed to parse SSE data:", error, "Raw data:", currentData)
                    }
                  } else if (currentEvent === "complete") {
                    sink.complete()
                    return
                  } else if (currentEvent === "ack") {
                    console.log("Subscription acknowledged")
                  }

                  // Reset for next event
                  currentEvent = ""
                  currentData = ""
                }
              }
            }
          } catch (error) {
            if (error.name !== "AbortError") {
              console.error("SSE subscription error:", error)
              sink.error(error)
            }
          }
        }

        runSubscription()

        return {
          unsubscribe() {
            controller.abort()
          },
        }
      },
    }
  },
})

const client = createClient({
  url: "http://localhost:8686/graphql",
  exchanges: [cacheExchange, fetchExchange, modusSSEExchange],
})

interface GraphQLProviderProps {
  children: React.ReactNode
}

export function GraphQLProvider({ children }: GraphQLProviderProps) {
  return <Provider value={client}>{children}</Provider>
}
