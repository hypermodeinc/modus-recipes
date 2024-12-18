import { Chunk } from "./chunk";
import { RankedDocument} from "./ranking";

@json
export class RagContext {
  text: string = "";
  sources: RagSource[] = [];
}
@json
export class RagSource {
  docid: string = "";
  text: string = "";
  chunks: Chunk[] = [];
}