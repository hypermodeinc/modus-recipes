/*
  functions to handle RAG chunks using Hypermode collections and models
*/

import { models, collections } from "@hypermode/modus-sdk-as";
import { DocPage, Chunk , ChunkSection, getFlatChunks} from "./chunk"
import { splitMarkdown, splitMarkdownHeaderText } from "./text-splitters";
import {
  removeItemsFromCollection,
  rankCollection_vector,
} from "./collections_utils";
import {
  OpenAIChatModel,
  SystemMessage,
  UserMessage,
} from "@hypermode/modus-sdk-as/models/openai/chat";
import { mutateDoc, computeChunkEmbeddings, removeChunkSections } from "./chunk_dgraph";
import { RankedDocument } from "./ranking";

const RAG_COLLECTION = "ragchunks";
const DGRAPH_CONNECTION = "dgraph-grpc";
/* model from hypermode.json used to generate text */
const modelName: string = "text-generator";


@json
export class RagChunkInfo {
  data: Chunk = new Chunk();
  score: number = 0.0;
}


@json
export class RagContext {
  text: string = "";
  chunks: Chunk[] = [];
  matching_chunk: RankedDocument[] = [];
  similarity_score: number = 0.0;
}




export function removePage(id: string, namespace: string = ""): string {
  removeChunkSections(DGRAPH_CONNECTION, id);
  return "Success"
}

export function addMarkdownPage(
  id: string,
  mdcontent: string,
  max_word: i32 = 500,
  namespace: string = "",
): Chunk[] {
  removePage(id, namespace);
  const doc = addPageToDgraph(DGRAPH_CONNECTION, id, mdcontent, max_word, namespace);
  return getFlatChunks(doc.root);

}

/**
 * Rank the documents in the namespace based on the query
 * merge the results from the vector and bm25 ranking using RRF
 * @param query - the query to rank the documents
 * @param limit - the number of documents to return
 * @param rrf_limit - the number of documents to return after RRF
 * @param namespace - the namespace to search for the documents
 * @returns RagRanking object with the final ranking and the individual rankings
 * */



export function queryDocChunk(namespace: string = ""): Map<string, string> {
  return queryRagChunk(RAG_COLLECTION, namespace);
}

export function rank(
  query: string,
  limit: i32 = 10,
  namespace: string = "",
): RankedDocument[] {
  return rankCollection_vector(
    query,
    RAG_COLLECTION,
    "contentEmbedding",
    limit,
    namespace,
  );
}

export function getRagContext(
  question: string,
  limit: i32 = 10,
  namespace: string = "",
): RagContext | null {
  /* 
    get closest chunk to the question
    build context by traversing the hierarchy of the chunk
    and concatenating the text of the chunks
    assuming 
    - id is in the form of "parent > child > grandchild"
  */
  const chunks = rank(question, limit, namespace);

  if (chunks.length == 0) {
    return null;
  }
  const context = getChunkContext(
    RAG_COLLECTION,
    chunks.map<string>((chunk) => chunk.id),
  );
  if (context == null) {
    return null;
  }
  context.matching_chunk = chunks;
  return context;
}

export function getChunkContext(
  collection_name: string,
  chunk_ids: string[],
  namespace: string = "",
): RagContext | null {
  /* 
    get closest chunk to the question
    build context by traversing the hierarchy of the chunk
    and concatenating the text of the chunks
    assuming 
    - id is in the form of "parent > child > grandchild"
  */
  const hierarchy = getChunksHierarchy(collection_name, chunk_ids,namespace);
  const chunks: Chunk[] = [];
  for (let i = 0; i < hierarchy.length; i++) {
    const path = hierarchy[i].split(">");
    path.pop();
    const parentID = path.join(">");
    // add level context
    let line = 0;
    while (true) {
      const chunk_id = `${parentID}>${line}`;
      console.log(`Looking for ${chunk_id}`);
      const parentText = collections.getText(collection_name, chunk_id);

      if (parentText != "") {
        line += 1;
        chunks.push(<Chunk>{
          id: chunk_id,
          content: parentText,
        });
      } else {
        break;
      }
    }
  }
  // concatenate all the chunks content
  const context = chunks.reduce<string>(
    (context, chunk) => context + "\n" + chunk.content,
    "",
  );
  return <RagContext>{
    text: context,
    chunks: chunks,
  };
}

export function getChunksHierarchy(
  collection_name: string,
  chunk_ids: string[],
  namespace: string = "",
): string[] {
  const chunks: Set<string> = new Set<string>();
  for (let i = 0; i < chunk_ids.length; i++) {
    const chunk_hierarchy = getChunkHierarchy(
      collection_name,
      chunk_ids[i],
      namespace,
    );
    for (let j = 0; j < chunk_hierarchy.length; j++) {
      chunks.add(chunk_hierarchy[j]);
    }
  }
  return chunks.values().sort((a, b) => a.localeCompare(b));
}

function getChunkHierarchy(
  collection_name: string,
  chunk_id: string,
  namespace: string = "",
): string[] {
  /* 
    get closest chunk to the question
    build context by traversing the hierarchy of the chunk
    and concatenating the text of the chunks
    assuming 
    - id is in the form of "parent > child > grandchild"
  */
  const chunks: string[] = [];
  if (collections.getText(collection_name, chunk_id, namespace) != "") {
    const hierarchy = chunk_id.split(">");
    hierarchy.pop();
    while (hierarchy.length > 0) {
      const parentID = `${hierarchy.join(">")}>0`;
      if (collections.getText(collection_name, parentID, namespace) != "") {
        chunks.unshift(parentID);
      }
      hierarchy.pop();
    }
  }
  return chunks;
}

function addPageToCollection(
  collection_name: string,
  id: string,
  mdcontent: string,
  max_word: i32 = 500,
  namespace: string = "",
): Chunk[] {
  const labels: string[][] = []; // no labels
  removeItemsFromCollection(collection_name, id, namespace);
  const chunks = splitMarkdownHeaderText(id, mdcontent, max_word);
  collections.upsertBatch(
    collection_name,
    chunks.map<string>((chunk) => chunk.id),
    chunks.map<string>((chunk) => chunk.content),
    labels,
    namespace,
  );
  return chunks;
}
function addPageToDgraph(
  connection: string,
  id: string,
  mdcontent: string,
  max_word: i32 = 500,
  namespace: string = ""
): DocPage {
  const labels: string[][] = []; // no labels
  const doc = splitMarkdown(id, mdcontent, max_word);
  computeChunkEmbeddings(doc);
  mutateDoc(connection, doc);
  return doc;
}

@json
export class RagResponse {
  text: string = "";
  context: RagContext | null = null;
}

export function generateResponseFromDoc(
  question: string,
  namespace: string = "",
): RagResponse {
  const ranking_limit = 10;
  const ragContext = getRagContext(
    question,
    ranking_limit,
    namespace,
  );
  if (ragContext == null) {
    return <RagResponse>{
      text: "Can't find any documentation to answer your question.",
      context: null,
    };
  }
  const response = generateResponse(question, ragContext.text);
  return <RagResponse>{ text: response, context: ragContext };
}

function generateResponse(question: string, context: string): string {
  const model = models.getModel<OpenAIChatModel>(modelName);
  const instruction = `Reply to the user question using only information from the text in triple quotes. 
    The response starts with a short and concise sentence, followed by a more detailed explanation.
    If the answer isn't easily available in the context, reply  "I don't know".

    """
    ${context}
    """
    `;

  const input = model.createInput([
    new SystemMessage(instruction),
    new UserMessage(question),
  ]);

  // This is one of many optional parameters available for the OpenAI Chat model.
  input.temperature = 0.5;

  // Here we invoke the model with the input we created.
  const output = model.invoke(input);

  // The output is also specific to the ChatModel interface.
  // Here we return the trimmed content of the first choice.
  return output.choices[0].message.content.trim();
}

export function queryRagChunk(
  collection_name: string,
  namespace: string = "",
): Map<string, string> {
  return collections.getTexts(collection_name, namespace);
}
