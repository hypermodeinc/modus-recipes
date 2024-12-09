import { collections } from "@hypermode/modus-sdk-as";
import { models } from "@hypermode/modus-sdk-as";
import { EmbeddingsModel } from "@hypermode/modus-sdk-as/models/experimental/embeddings";

const textsCollection = "texts";
const searchMethod = "searchMethod1";
const embeddingModelName = "minilm";

/**
 * Add text(s) to the collection
 */
export function upsertTexts(ids: string[], texts: string[]): string[] {
  const errors: string[] = [];

  if (ids.length !== texts.length) {
    errors.push("Length of all arrays must be the same");
    return errors;
  }

  let result = collections.upsertBatch(textsCollection, ids, texts);

  if (!result.isSuccessful) {
    errors.push(result.error);
    return errors;
  }

  return ids;
}

/**
 * Perform a vector search using an embedding of the input string
 */
export function search(query: string): string[] {
  const searchResults = collections.search(
    textsCollection,
    searchMethod,
    query,
    10,
    true,
  );

  if (!searchResults.isSuccessful) {
    return [searchResults.error];
  }
  const searchTexts: string[] = [];

  for (let i = 0; i < searchResults.objects.length; i++) {
    const obj = searchResults.objects[i];
    const text = collections.getText(textsCollection, obj.key);
    if (text) {
      searchTexts.push(text);
    }
  }
  return searchTexts;
}

/**
 * Embed the input text(s) using the miniLM embedding model
 */
export function miniLMEmbed(texts: string[]): f32[][] {
  const model = models.getModel<EmbeddingsModel>(embeddingModelName);
  const input = model.createInput(texts);
  const output = model.invoke(input);

  return output.predictions;
}
