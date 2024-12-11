import { Chunk } from "./chunk";
import { RankedDocument} from "./ranking";

@json
export class RagContext {
  text: string = "";
  chunks: Chunk[] = [];
  matching_chunk: RankedDocument[] = [];
  similarity_score: number = 0.0;
}