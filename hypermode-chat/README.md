# Hypermode Agent Chat Demo

A modern AI chat interface built with React, Next.js, and the **aichatkit** component library,
powered by Hypermode agents with persistent memory.

## Overview

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **UI Components**: aichatkit modular chat components
- **Backend**: Custom Hypermode agent adapter via GraphQL
- **Features**: Persistent agent memory, fact storage, conversation management

## Architecture

### Custom Agent Integration

Each conversation gets its own dedicated Hypermode agent with independent memory:

```typescript
const agentAdapter = new CustomAgentAdapter({
  apolloClient,
  debug: process.env.NODE_ENV === "development",
})
```

**Agent Flow:**

1. **Create**: `startChatAgent()` → New agent instance per conversation
2. **Chat**: `sendMessage()` → Agent processes with full memory context
3. **Remember**: Agents can save/retrieve facts using built-in tools
4. **Cleanup**: `stopChatAgent()` → Proper session termination

### Required GraphQL Schema

```graphql
mutation CreateConversation {
  createConversation
}

query ContinueChat($id: String!, $query: String!) {
  continueChat(id: $id, query: $query)
}

query ChatHistory($id: String!) {
  chatHistory(id: $id)
}

mutation DeleteAgent($id: String!) {
  deleteAgent(id: $id)
}
```

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

```bash
# .env.local
NEXT_PUBLIC_GRAPHQL_API_URL=http://localhost:8686/graphql
NEXT_PUBLIC_GRAPHQL_API_TOKEN=your-token
```

### Run

```bash
npm run dev
```

**Note**: Ensure your Hypermode agent backend is running first.

## Key Features

### Agent Memory

- Each conversation has independent agent memory
- Agents remember conversation history and can save facts
- Memory persists across browser sessions

### Conversation Management

- Create new conversations (new agent instances)
- Reset conversations (fresh agent memory)
- Delete conversations (cleanup agent sessions)

### Synchronization

- localStorage + agent backend sync
- Conversation history maintained on both ends
- Automatic recovery on app restart

## Configuration

### Debug Mode

```typescript
const agentAdapter = new CustomAgentAdapter({
  apolloClient,
  debug: true, // Enable detailed logging
})
```

### Customization

- **Styling**: Modify `tailwind.config.ts` for theme changes
- **Icons**: Replace Lucide React icons as needed
- **Backend**: Update GraphQL queries in `CustomAgentAdapter`

## Troubleshooting

**Agent Backend Not Running**: Check GraphQL endpoint and ensure backend is started **Schema
Mismatch**: Verify GraphQL operations match expected schema **Session Issues**: Check browser
localStorage and agent cleanup logs **Debug**: Enable `debug: true` in adapter for detailed agent
communication logs

## aichatkit Packages

- `@aichatkit/ui` - Chat interface components
- `@aichatkit/network-adapter` - Base adapter interface
- `@aichatkit/localstorage-adapter` - Local storage persistence
- `@aichatkit/types` - TypeScript definitions
