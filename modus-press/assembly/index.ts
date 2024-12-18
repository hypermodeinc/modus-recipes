/* 
This example Modus app exposes two GraphQL Query fields to add LLM-backed features 
to a hypothetical blogging platform capable of suggesting blog post titles and HTML 
meta tags optimized for SEO based on the blog post content in the style of the 
blog post author.
*/

import { models, postgresql } from "@hypermode/modus-sdk-as"

import {
  OpenAIChatModel,
  ResponseFormat,
  SystemMessage,
  UserMessage,
} from "@hypermode/modus-sdk-as/models/openai/chat"

/**
 * Generate HTML meta description tag content optimized for SEO based on the blog post content
 */
export function genSEO(postContent: string): string {
  const suggestedTag = generateText(
    "You are an SEO expert",
    `Create the HTML meta description tag for a blog post with the following content, only return the meta tag value: ${postContent}`,
  )

  return suggestedTag
}

/**
 * Generate a suggested blog post title using the blog post content and category, leveraging
 * the author's biography data retrieved from a Postgres database to match the author's style
 */
export function genTitle(postContent: string, postCategory: string, authorName: string): string {
  const author = getAuthorByName(authorName)

  const suggestedTitle = generateText(
    "You are a copyeditor",
    `
  Create a title for the following blog post, in the style of ${author.name}. Only return the title text.
    
  Blog post content: ${postContent}

  Blog post category: ${postCategory}

  Author biography: ${author.bio}
`,
  )

  return suggestedTitle
}

/**
 * Use our LLM to generate text based on an instruction and prompt
 */
function generateText(instruction: string, prompt: string): string {
  const model = models.getModel<OpenAIChatModel>("llama")

  const input = model.createInput([new SystemMessage(instruction), new UserMessage(prompt)])

  input.temperature = 0.7
  const output = model.invoke(input)

  return output.choices[0].message.content.trim()
}

// The connection host for our Postgres database, as defined in modus.json
const host = "moduspressdb"

/**
 * The author information
 */
@json
class Author {
  id: i32 = 0
  name!: string
  bio!: string
}

/**
 * Query our database to find author information
 */
function getAuthorByName(name: string): Author {
  const query = "select * from authors where name = $1"

  const params = new postgresql.Params()
  params.push(name)

  const response = postgresql.query<Author>(host, query, params)
  return response.rows[0]
}
