/**
 * Utility classes and functions used to interact with Dgraph.
 */
import { dgraph } from "@hypermode/modus-sdk-as";
import { JSON } from "json-as";
import { JSON as JSON_TREE } from "assemblyscript-json/assembly/index";


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
  id_field: string = "";
  relationships: Relationship[] = [];
}
export class GraphSchema {
  node_types: Map<string, NodeType> = new Map<string, NodeType>();
}

/**
 * modify the json payload to add the uid of the root and the nested entities when they exist in Dgraph
 * for non existing entities, a blank uid is generated helping the interpretation of mutation response
 */

export function injectNodeUid(
  connection: string,
  payload: string,
  root_type: string,
  schema: GraphSchema,
): string {
  const root_node_type = schema.node_types.get(root_type);

  const root = <JSON_TREE.Obj>JSON_TREE.parse(payload);
  injectNodeType(connection, root, root_type, schema);

  console.log(root.toString());

  return root.toString();
}

/**
 * recursively inject the dgraph.type and uid of the entities in the json tree
 */
function injectNodeType(
  connection: string,
  entity: JSON_TREE.Obj | null,
  type: string,
  schema: GraphSchema,
): void {
  if (entity != null) {
    entity.set("dgraph.type", type);
    const node_type = schema.node_types.get(type);
    for (var i = 0; i < node_type.relationships.length; i++) {
      const predicate = node_type.relationships[i].predicate;
      const type = node_type.relationships[i].type;
      injectNodeType(connection, entity.getObj(predicate), type, schema);
    }

    const id_field = entity.getString(node_type.id_field);
    if (id_field != null) {
      const id_value = entity.getString(node_type.id_field)!.toString();
      if (id_value != null) {
        const node_uid = getEntityUid(
          connection,
          `${node_type.id_field}`,
          id_value,
        );
        if (node_uid != null) {
          entity.set("uid", node_uid);
        } else {
          entity.set("uid", `_:${type}-${id_value}`);
        }
      }
    }
  }
}

export function getEntityById<T>(
  connection: string,
  predicate: string,
  id: string,
  body: string,
): T | null {
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

function getEntityUid(
  connection: string,
  predicate: string,
  value: string,
): string | null {
  const query = new dgraph.Query(
    `{uids(func: eq(${predicate}, "${value}")) {uid}}`,
  );
  const response = dgraph.execute(connection, new dgraph.Request(query));
  const data = JSON.parse<UidResult>(response.Json);
  if (data.uids.length == 0) {
    return null;
  }
  console.log(`${predicate} Uid: ${data.uids[0].uid}`);
  return data.uids[0].uid;
}

export function deleteNodePredicates(
  connection: string,
  criteria: string,
  predicates: string[],
): void {
  const query = new dgraph.Query(`{
        node as var(func: ${criteria}) 
    }`);
  predicates.push("dgraph.type");
  const del_nquads = predicates
    .map<string>((predicate) => `uid(node) <${predicate}> * .`)
    .join("\n");
  const mutation = new dgraph.Mutation("", "", "", del_nquads);

  dgraph.execute(connection, new dgraph.Request(query, [mutation]));
}

export function searchBySimilarity<T>(
  connection: string,
  embedding: f32[],
  predicate: string,
  body: string,
  topK: i32,
): T[] {
  const query = `
    query search($vector: float32vector) {
        var(func: similar_to(${predicate},${topK},$vector))  {    
            vemb as Product.embedding 
            dist as math((vemb - $vector) dot (vemb - $vector))
            score as math(1 - (dist / 2.0))
        } 
        
        list(func:uid(score),orderdesc:val(score))  @filter(gt(val(score),0.25)){ 
            ${body}
            score:val(score)
        }
    }`;
  const vars = new dgraph.Variables();
  vars.set("$vector", JSON.stringify(embedding));

  const dgraph_query = new dgraph.Query(query, vars);

  const response = dgraph.execute(connection, new dgraph.Request(dgraph_query));
  console.log(response.Json);
  return JSON.parse<ListOf<T>>(response.Json).list;
}

export function searchByTerm<T>(
  connection: string,
  predicate: string,
  terms: string,
  body: string,
  limit: i32,
): T[] {
  const raw = searchJsonByTerm(connection, predicate, terms, body, limit);
  if (raw != null) {
    return JSON.parse<T[]>(raw.toString());
  } else {
    return [];
  }
}

export function searchJsonByTerm(
  connection: string,
  predicate: string,
  terms: string,
  body: string,
  limit: i32,
): JSON_TREE.Arr {
  const query = `
  query search($terms: string, $limit: int) {
      list(func: anyofterms(${predicate},$terms),first:${limit})  { 
          uid   
          ${body}
      }
  }`;
  const vars = new dgraph.Variables();
  vars.set("$terms", terms);
  vars.set("$limit", limit.toString());

  const dgraph_query = new dgraph.Query(query, vars);

  const response = dgraph.execute(connection, new dgraph.Request(dgraph_query));
  return (<JSON_TREE.Obj>JSON_TREE.parse(response.Json)).getArr("list");
}

export function addEmbeddingToJson(
  payload: string,
  predicate: string,
  embedding: f32[],
): string {
  // Add the embedding to the payload at root level
  // TO DO: extend to nested entities and use JSONpath
  payload = payload.replace(
    "{",
    `{ \"${predicate}\":\"${JSON.stringify(embedding)}\",`,
  );
  return payload;
}
