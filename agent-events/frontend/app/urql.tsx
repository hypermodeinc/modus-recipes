"use client"

import { createClient, Provider, cacheExchange, fetchExchange, subscriptionExchange } from "urql"
import { createClient as createSSEClient } from "graphql-sse"

const sseClient = createSSEClient({
  url: "http://localhost:8686/graphql",
})

export const client = createClient({
  url: "http://localhost:8686/graphql",
  exchanges: [
    cacheExchange,
    fetchExchange,
    subscriptionExchange({
      forwardSubscription(operation) {
        return {
          subscribe: (sink) => {
            // @ts-ignore
            const dispose = sseClient.subscribe(operation, sink)
            return {
              unsubscribe: dispose,
            }
          },
        }
      },
    }),
  ],
})

interface GraphQLProviderProps {
  children: React.ReactNode
}

export function GraphQLProvider({ children }: GraphQLProviderProps) {
  return <Provider value={client}>{children}</Provider>
}
