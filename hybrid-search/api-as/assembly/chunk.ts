
@json
export class Chunk {

  @alias("dgraph.type")
  type: string = "Chunk";


  @alias("uid")
  uid: string = "";


  @alias("Chunk.id")
  id: string = "";


  @alias("Chunk.docid")
  docid: string = "";


  @alias("Chunk.order")
  order: u32 = 0;


  @alias("Chunk.content")
  content: string = "";


  @alias("Chunk.vector_embedding")
  embedding: string | null = null;
}


@json
export class RankedChunk extends Chunk {
  similarity_score: f32 = 0.0;
}


@json
export class ChunkSection {

  @alias("dgraph.type")
  type: string = "ChunkSection";


  @alias("ChunkSection.docid")
  docid!: string;


  @alias("ChunkSection.id")
  id!: string;


  @alias("ChunkSection.level")
  level: u32 = 0;


  @alias("ChunkSection.order")
  order: u32 = 0;


  @alias("ChunkSection.chunks")
  chunks: Chunk[] = [];


  @alias("ChunkSection.children")
  children: ChunkSection[] = [];
}


@json
export class DocPage {

  @alias("dgraph.type")
  type: string = "DocPage";


  @alias("DocPage.docid")
  docid!: string;


  @alias("DocPage.root")
  root!: ChunkSection;
}

export function getFlatChunks(section: ChunkSection): Chunk[] {
  const stack: ChunkSection[] = [section]; // Initialize the stack with the root section
  const flatChunks: Chunk[] = [];

  while (stack.length > 0) {
    const currentSection = stack.pop();

    // Add the chunks of the current section to the flat list
    for (let i = 0; i < currentSection.chunks.length; i++) {
      flatChunks.push(currentSection.chunks[i]);
    }

    // If there are children, push them onto the stack
    for (let i = 0; i < currentSection.children!.length; i++) {
      stack.push(currentSection.children[i]);
    }
  }

  return flatChunks.sort((a, b) => (b.id > a.id ? 1 : -1));
}
