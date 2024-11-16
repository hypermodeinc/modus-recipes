import { models } from "@hypermode/modus-sdk-as";
import { EmbeddingsModel } from "@hypermode/modus-sdk-as/models/experimental/embeddings";

const EMBEDDING_MODEL = "minilm";


export function embedText(content: string[]): f32[][] {
  const model = models.getModel<EmbeddingsModel>(EMBEDDING_MODEL);
  const input = model.createInput(content);
  const output = model.invoke(input);
  return output.predictions;
}
