import { http, models } from "@hypermode/modus-sdk-as";
import { Article, ArticleResult } from "./classes";

import {
  OpenAIChatModel,
  ResponseFormat,
  SystemMessage,
  UserMessage,
} from "@hypermode/modus-sdk-as/models/openai/chat";

/**
 * Fetch most popular articles and use LLM to copywrite additional title options
 */
export function fetchNews(): Article {
  const response = http.fetch(
    "https://api.nytimes.com/svc/mostpopular/v2/emailed/7.json",
  );
  const article_result = response.json<ArticleResult>();

  const article = article_result.results[0];
  article.alt_title = generateText(
    "You are a newspaper editor",
    `Please copywrite the title of a newspaper article based on this description, only respond with the article title text: ${article.description}`,
  );

  return article;
}

/**
 * Use our LLM to generate text based on an instruction and prompt
 */
export function generateText(instruction: string, prompt: string): string {
  const model = models.getModel<OpenAIChatModel>("text-generator");

  const input = model.createInput([
    new SystemMessage(instruction),
    new UserMessage(prompt),
  ]);

  input.temperature = 0.7;
  const output = model.invoke(input);

  return output.choices[0].message.content.trim();
}
