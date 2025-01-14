"use client"

import { ApolloClient, ApolloProvider, InMemoryCache, HttpLink, from } from "@apollo/client"
import { setContext } from "@apollo/client/link/context"

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL || "http://localhost:8686/graphql",
})

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      authorization: `Bearer ${process.env.NEXT_PUBLIC_GRAPHQL_API_KEY}`,
    },
  }
})

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: from([authLink, httpLink]),
})

export function ApolloWrapper({ children }: React.PropsWithChildren<{}>) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>
}
