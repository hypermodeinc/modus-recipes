"use client"

import { ApolloClient, ApolloProvider, InMemoryCache, HttpLink, from } from "@apollo/client"
import { setContext } from "@apollo/client/link/context"
import { RetryLink } from "@apollo/client/link/retry"

export function ApolloWrapper({ children }: React.PropsWithChildren<{}>) {
  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL || "http://localhost:8686/graphql",
  })

  const authLink = setContext((_, { headers }) => {
    const token = process.env.NEXT_PUBLIC_GRAPHQL_API_TOKEN || ""

    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      },
    }
  })

  const retryLink = new RetryLink({
    attempts: {
      max: 3,
    },
  })

  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: from([retryLink, authLink, httpLink]),
  })

  return <ApolloProvider client={client}>{children}</ApolloProvider>
}
