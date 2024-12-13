/**
 * Utility classes and functions used to interact with Dgraph.
 */
import { dgraph } from "@hypermode/modus-sdk-as"
import { JSON } from "json-as"


@json
class Uid {
  uid: string = "";
}
@json 
class UidResult {
  uids: Uid[] = [];
}
@json 
export class ListOf<T> {
    list: T[] = [];
}
export class Relationship {
    predicate!: string;
    type!: string;
}
export class NodeType {
    id_field: string = ""
    relationships : Relationship[] = [];
}
export class GraphSchema {
    node_types: Map<string, NodeType> = new Map<string, NodeType>();
}




export function getEntityById<T>(connection: string, predicate: string, id: string, body: string): T | null{
    const query = new dgraph.Query(`{
      list(func: eq(${predicate}, "${id}")) {
          ${body}
        }
      }`);
    const response = dgraph.execute(connection, new dgraph.Request(query));
    const data = JSON.parse<ListOf<T>>(response.Json);
    if (data.list.length > 0) {
      return data.list[0];
    } 
    return null;
  }

function getEntityUid(connection: string,predicate:string, value: string): string | null{

    const query = new dgraph.Query(`{uids(func: eq(${predicate}, "${value}")) {uid}}`);
    const response = dgraph.execute(connection, new dgraph.Request(query ))
    const data = JSON.parse<UidResult>(response.Json)
    if (data.uids.length == 0) {
      return null
    }
    console.log(`${predicate} Uid: ${data.uids[0].uid}`)
    return data.uids[0].uid
  }

  export function deleteNodePredicates(connection:string, criteria: string, predicates: string[]): void {

    const query = new dgraph.Query(`{
        node as var(func: ${criteria}) 
    }`);
    predicates.push("dgraph.type");
    const del_nquads = predicates.map<string>((predicate) => `uid(node) <${predicate}> * .`).join("\n");
    const mutation = new dgraph.Mutation("","","",del_nquads);
    
    dgraph.execute(connection, new dgraph.Request(query, [mutation]));
    
}

export function searchBySimilarity<T>(connection:string, embedding: f32[],predicate:string, body:string, topK: i32 = 10, threshold:f32 = 0.75): T[]{

    const query = `
    query search($vector: float32vector) {
        var(func: similar_to(${predicate},${topK},$vector))  {    
            vemb as ${predicate} 
            dist as math((vemb - $vector) dot (vemb - $vector))
            score as math(1 - (dist / 2.0))
        } 
        
        list(func:uid(score),orderdesc:val(score))  @filter(gt(val(score),${threshold})){ 
            ${body}
        }
    }`
    const vars = new dgraph.Variables();
    vars.set("$vector", JSON.stringify(embedding));
  
    const dgraph_query = new dgraph.Query(query,vars);
  
    const response = dgraph.execute(connection, new dgraph.Request(dgraph_query));
    console.log(response.Json)
    return JSON.parse<ListOf<T>>(response.Json).list
  }


