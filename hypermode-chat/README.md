# Lightweight chat UI

Components for Hypermode powered chats.

![chat UI](image.png)

## Getting Started

First, run the development server:

```bash
pnpm i && pnpm run dev
```

Open [the local dev server](http://localhost:3000) with your browser to see the result.

Modify `app/page.tsx` to change the UI.

The chat action is implemented in action.ts. Update the GraphQL query to match your backend API.

```graphql
query chat($query: String!, $chat: [ChatMessageInput!]!, $user_preferences: String!) {
  chat(query: $query, chat: $chat, user_preferences: $user_preferences) {
    message
    isQuestion
    user_preferences
  }
}
```

The current implementation is using a simple fetch at `process.env.HYPERMODE_API_ENDPOINT`, with the
Bearer token authorization using `process.env.HYPERMODE_API_TOKEN`

Set the environment variables to match the GraphQL API endpoint.

For local dev:

```bash
export HYPERMODE_API_ENDPOINT=http://localhost:8686/graphql
```
