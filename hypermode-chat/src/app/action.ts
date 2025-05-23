"use server"

type FetchQueryProps = {
  query: string
  variables?: any
}

const fetchQuery = async ({ query, variables }: FetchQueryProps) => {
  try {
    const res = await fetch(process.env.HYPERMODE_API_ENDPOINT as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.HYPERMODE_API_TOKEN}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      cache: "no-store",
    })

    if (res.status < 200 || res.status >= 300) {
      throw new Error(res.statusText)
    }

    const { data, error, errors } = await res.json()
    return { data, error: error || errors }
  } catch (err) {
    console.error("error in fetchQuery:", err)
    return { data: null, error: err }
  }
}

export interface Message {
  id: number
  content: string
  role: "user" | "assistant"
}

export async function chat(query: string, messages: Message[], user_preferences: string = "") {
  const chat = messages.map((message) => ({
    role: message.role,
    content: message.content,
  }))
  const graphqlQuery = `
    query chat($query: String!, $chat: [ChatMessageInput!]!, $user_preferences: String!) {
        chat(query: $query, chat: $chat, user_preferences: $user_preferences) {
            message
            isQuestion
            user_preferences
            
        }
    }
  `

  const { error, data } = await fetchQuery({
    query: graphqlQuery,
    variables: { query, chat, user_preferences },
  })

  if (error) {
    return { error: Array.isArray(error) ? error[0] : error }
  } else {
    return { data }
  }
}
