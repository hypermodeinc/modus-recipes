/** 
 * Dgraph storage for chunk data
 */
import {dgraph } from "@hypermode/modus-sdk-as";
import { DocPage, ChunkSection, getFlatChunks } from "./chunk"
import {embedRagChunk} from "./embeddings"
import { JSON } from "json-as"

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