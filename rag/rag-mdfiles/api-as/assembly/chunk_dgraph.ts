/** 
 * Dgraph storage for chunk data
 */
import {dgraph } from "@hypermode/modus-sdk-as";
import { DocPage, RankedChunk, getFlatChunks } from "./chunk"
import {embedRagChunk} from "./embeddings"
import { JSON } from "json-as"
import { RankedDocument } from "./ranking";

/**
 * Upsert a chunk in the dgraph database
 * @param connection - the connection to the dgraph database
 * @param chunk - the chunk to upsert
 * @returns the uids of the inserted nodes
 */
export function computeChunkEmbeddings(doc: DocPage): void {
    /* get flat chunks, build content list and compute embeddings */
    const flatChunks = getFlatChunks(doc.root);
    const content = flatChunks.map<string>(chunk => chunk.content);
    const embeddings = embedRagChunk(content);
    for (let i = 0; i < flatChunks.length; i++) {
      flatChunks[i].embedding = JSON.stringify(embeddings[i])
    }
}
export function mutateDoc(connection: string, doc: DocPage): Map<string, string> | null {
    
    
    /*
    const embedding = embedRagChunk([chunk.content])[0];
    const query: dgraph.Query = new dgraph.Query(`query { node as var(func: eq(Chunk.id, "${chunk.id}")) }`);
    const rdf = `
    uid(node) <Chunk.id> "${chunk.id}" .
    uid(node) <Chunk.content> ${JSON.stringify(chunk.content)} .`;
    */
    const chunk_json = JSON.stringify(doc);
    const mutations: dgraph.Mutation[] = [new dgraph.Mutation(chunk_json)];
    const uids = dgraph.execute(connection, new dgraph.Request(null, mutations)).Uids;
    
    return uids;
  }

  export function removeChunkSections(connection: string, docid: string): void {
    const query = new dgraph.Query(`
        query { 
            p as var(func:eq(DocPage.docid, "${docid}"))
            n as var(func:eq(ChunkSection.docid, "${docid}")) { 
               c as ChunkSection.Chunks 
            }
        }
        `);
    const mutation = new dgraph.Mutation("","","",
        ` 
        uid(p) * * .
        uid(n) * * .
        uid(c) * * .
        `);

    dgraph.execute(connection, new dgraph.Request(query,[mutation]))
        
  }

  @json
  class SimilarChunkResult {
    result: RankedChunk[] = [];
  }

  export function rank_by_similarity(
    connection: string,
    search_string: string,
    limit: i32 = 10,
    threshold: f32 = 0.75,
    namespace: string = "",
  ): RankedDocument[] {
    const embedding = embedRagChunk([search_string])[0];
    const vars = new dgraph.Variables()
    vars.set("$vector", JSON.stringify(embedding))
    vars.set("$limit", limit)
    const dql_query = `
    query similar($vector: float32vector, $limit: int) {
          var(func: similar_to(Chunk.vector_embedding, $limit, $vector)) {
            v1 as Chunk.vector_embedding
            similarity_score as Math ((1.0 + (($vector) dot v1)) / 2.0)
          }
      
      
        result(func: uid(similarity_score), orderdesc: val(similarity_score)) @filter(ge(val(similarity_score), ${threshold}))
        {     
            Chunk.id
            Chunk.uid:uid
            Chunk.docid
            Chunk.order
            Chunk.content
            similarity_score: val(similarity_score) 
        }
    }
    `
    console.log(dql_query)
    const query = new dgraph.Query(dql_query, vars);
    const resp = dgraph.execute(connection, new dgraph.Request(query));
    const response = JSON.parse<SimilarChunkResult>(resp.Json).result;
    
    // create a RankedDocument array
    const rankedDocuments: RankedDocument[] = [];
    for (let i = 0; i < response.length; i++) {
      rankedDocuments.push(<RankedDocument>{
        id: response[i].uid,
        docid: response[i].docid,
        score: response[i].similarity_score,
        content: response[i].content,
      });
    }
    // we don't have to slice the array because the limit is already set in the search function
    return rankedDocuments;
  }

  export function search_by_term(
    connection: string,
    search_string: string,
    limit: i32 = 10,
    threshold: f32 = 0.75,
    namespace: string = "",
  ): RankedChunk[] {

    const vars = new dgraph.Variables()
    vars.set("$terms", search_string)

    const dql_query = `
    query similar($terms: string) {
          result(func: anyofterms(Chunk.content, $terms)) {
            Chunk.id
            Chunk.uid:uid
            Chunk.docid
            Chunk.order
            Chunk.content
          }
    }
    `
    console.log(dql_query)
    const query = new dgraph.Query(dql_query, vars);
    const resp = dgraph.execute(connection, new dgraph.Request(query));
    const response = JSON.parse<SimilarChunkResult>(resp.Json).result;
    return response
    
  }
  
  @json
  class DocPageResult {
    result: DocPage[] = [];
  }

  export function getPageSubTrees(
    connection: string,
    chunk_ids: string[],
    namespace: string = "",
  ): DocPage[]  {
    /* find the chunks hierarchy based on parents and then rebuild a sub-tree for each document */

    const dql_query = `
    query tree($chunk_ids: string) {
       
        c as var(func:uid(${JSON.stringify(chunk_ids).slice(1,-1)}))  @recurse(depth:6)  {
            s1 as ~ChunkSection.chunks 
            s2 as ~ChunkSection.children 
            c2 as ChunkSection.chunks
            r as ~DocPage.root
        }
        
         result(func:uid(r))  @recurse(depth:5){
     DocPage.docid
     DocPage.root
       ChunkSection.id
       ChunkSection.level
       ChunkSection.order
       Chunk.id
       Chunk.content
       Chunk.order
       ChunkSection.children @filter(uid(s2,s1)) 
       ChunkSection.chunks  @filter(uid(c,c2)) 
      
  }
    }
    `
    const query = new dgraph.Query(dql_query);
    const resp = dgraph.execute(connection, new dgraph.Request(query));
    const response = JSON.parse<DocPageResult>(resp.Json).result;
    return response;
  }