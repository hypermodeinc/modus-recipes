/*
  functions to handle RAG chunks using Hypermode collections and models
*/

import { models } from "@hypermode/modus-sdk-as";
import { DocPage, Chunk , getFlatChunks} from "./chunk"
import { splitMarkdown } from "./text-splitters";
import { RagContext, RagSource } from "./rag_classes";
import { Document, rankDocuments, tokenize } from "./bm25";
import {
  OpenAIChatModel,
  SystemMessage,
  UserMessage,
} from "@hypermode/modus-sdk-as/models/openai/chat";
import { mutateDoc, computeChunkEmbeddings, deleteDocument, rank_by_similarity, getPageSubTrees, search_by_term } from "./chunk_dgraph";
import { RankedDocument } from "./ranking";

const DGRAPH_CONNECTION = "dgraph-grpc";
/* model from hypermode.json used to generate text */
const modelName: string = "text-generator";


@json
export class RagChunkInfo {
  data: Chunk = new Chunk();
  score: number = 0.0;
}


export function removePage(id: string): string {
  deleteDocument(DGRAPH_CONNECTION, id);
  return "Success"
}

export function addMarkdownPage(
  id: string,
  mdcontent: string,
  max_word: i32 = 500,
  namespace: string = "",
): Chunk[] {
  removePage(id);
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




export function rank(
  query: string,
  limit: i32 = 10,
  threshold: f32 = 0.75,
  namespace: string = "",
): RankedDocument[] {
  return rank_by_similarity(DGRAPH_CONNECTION, query, limit, threshold, namespace); 
}

export function rank_bm25(
  query: string,
  limit: i32 = 10,
  threshold: f32 = 0.75,
  namespace: string = "",
): RankedDocument[] {
  const clean_query = tokenize(query).join(" ");
  const chunks = search_by_term(DGRAPH_CONNECTION, clean_query, limit, threshold, namespace);
  const documents = chunks.map<Document>((chunk) => {
    return <Document>{
      id: chunk.uid,
      content: chunk.content}})
  return rankDocuments(tokenize(query), documents).slice(0, limit);
}

export function getMatchingSubPages(
  question: string,
  limit: i32 = 10,
  threshold: f32 = 0.75,
  namespace: string = "",
): DocPage[]{ //RagContext
  
  //get closest chunk to the question
  const ranked = rank(question, limit,threshold, namespace);
   
  if (ranked.length == 0) {
    return [];
  }
  // use id of the chuks
  const ids = ranked.map<string>((chunk) => chunk.id);
  //  build context by traversing the hierarchy of the chunk
  const docs = getPageSubTrees(DGRAPH_CONNECTION, ids);
  return docs
}
export function getRagContext(
  question: string,
  limit: i32 = 10,
  threshold: f32 = 0.75,
  namespace: string = "",
): RagContext | null{ //RagContext
  const docs = getMatchingSubPages(question, limit,threshold, namespace);
  const context : RagContext = new RagContext();

  if (docs.length == 0) {
    return null;
  }
  for (let i = 0; i < docs.length; i++) {
    const chunks = getFlatChunks(docs[i].root);
    // concatenate all the chunks content
    const extract = chunks.reduce<string>(
      (context, chunk) => context + "\n" + chunk.content,
      "",
    );
    const doc_extract = <RagSource>{
      docid: docs[i].docid,
      text: extract, 
      chunks: chunks,
    };
    context.sources.push(doc_extract);
  }
  
  return context
}


function addPageToDgraph(
  connection: string,
  id: string,
  mdcontent: string,
  max_word: i32 = 500,
  namespace: string = ""
): DocPage {
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
  ranking_limit: i32 = 10,
  threshold: f32 = 0.75,
  namespace: string = "",
): RagResponse {

  const docContext = getRagContext(
    question,
    ranking_limit,
    threshold,
    namespace
  );


  if (docContext == null) {
    return <RagResponse>{
      text: "Can't find any documentation to answer your question.",
      context: null,
    };
  }
  const text = docContext.sources.reduce<string>((text, source) =>  {return text + "\n"+source.text}, "");
  const response = generateResponse(question, text);
  return <RagResponse>{ text: response, context: docContext };
}

function generateResponse(question: string, context: string): string {
  const model = models.getModel<OpenAIChatModel>(modelName);
  const instruction = `Reply to the user question using only information from the CONTEXT provided. 
    The response starts with a short and concise sentence, followed by a more detailed explanation.

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


