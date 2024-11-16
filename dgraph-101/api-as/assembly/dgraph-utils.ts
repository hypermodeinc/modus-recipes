
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
export class NestedEntity {

    predicate: string = "";
    type: string = "";
    id_field: string = "";
    id_value: string | null = null;

}

export function injectNodeUid(connection:string, payload: string, nested_entities: NestedEntity[]): string {
    const root_entity = nested_entities[0];

    payload = payload.replace("{", `{ \"dgraph.type\":\"${root_entity.type}\",`)
    
    for (var i = 1; i < nested_entities.length; i++) {
        const predicate = nested_entities[i].predicate;
        const type = nested_entities[i].type;
        payload = payload.replace(`${predicate}\":{`, `${predicate}\":{ \"dgraph.type\":\"${type}\",`);
    }

    for ( i = 0; i < nested_entities.length; i++) {
        var locator = `${nested_entities[i].predicate}\":{`
        if (i == 0) { 
            locator = "{"
        } 
        if(nested_entities[i].id_value != null) {
            const nodeUid = getEntityUid(connection,`${nested_entities[i].type}.${nested_entities[i].id_field}`, nested_entities[i].id_value!);
            if (nodeUid != null) {
                
                payload = payload.replace(`${locator}`, `${locator} "uid":"${nodeUid}",`)
            } else {
                payload = payload.replace(`${locator}`, `${locator} "uid": "_:${nested_entities[i].type}-${nested_entities[i].id_value!}",`)
            }
        } 
    
    }
  return payload
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

export function searchBySimilarity<T>(connection:string, embedding: f32[],predicate:string, body:string, topK: i32): T[]{

    const query = `
    query search($vector: float32vector) {
        var(func: similar_to(${predicate},${topK},$vector))  {    
            vemb as Product.embedding 
            dist as math((vemb - $vector) dot (vemb - $vector))
            score as math(1 - (dist / 2.0))
        } 
        
        list(func:uid(score),orderdesc:val(score))  @filter(gt(val(score),0.25)){ 
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


  