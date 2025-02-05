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

/**
 * JSON Encoder/Decoder for AssemblyScript
 */
export namespace LAB_DGRAPH {

  @json
  export class ListOf<T> {
    list: T[] = [];
  }


  @json
  export class a<T> {
    a: T | null = null;
  }


  @json
  export class NumUidsResult {
    numUids: i32 = 0;
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
  export function upsertEntity<T>(
    connection: string,
    namespace: string,
    record: T,
    id_predicate: string,
  ): string {
    const root = <JSON_TREE.Obj>JSON_TREE.parse(JSON.stringify(record));
    console.log(`Upserting ${namespace} ${root.toString()}`);
    if (root.has(id_predicate)) {
      const id: string = root.getString(id_predicate)!.toString();
      const query = new dgraph.Query(`{
        var(func: eq(${id_predicate}, "${id}"))
        }`);
      // build Nquads for upsert mutation
      var nquads = "";
      const predicates = root.keys;
      for (var i = 0; i < predicates.length; i++) {
        const predicate = predicates[i];
        const value = root.get(predicate);

        if (!value!.isObj) {
          if (value!.isString) {
            nquads += `_:${id} <${predicate}> "${value!.toString()}" .\n`;
          }
        }
      }
      const mutation = new dgraph.Mutation("", "", nquads);
      console.log(`Mutation: ${nquads}`);
      //dgraph.execute(connection, new dgraph.Request(query, [mutation]));
      return "success";
    } else {
      return "error";
    }
  }

  export function getEntityList<T>(connection: string, query: string): T[] {
    const dql_query = new dgraph.Query(query);
    const response = dgraph.execute(connection, new dgraph.Request(dql_query));
    const data = JSON.parse<ListOf<T>>(response.Json);
    return data.list;
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
    filter: string | null = null,
    criteria: string[] = [],
    topK: i32 = 10,
    threshold: f32 = 0.75,
  ): T[] {
    let query = "";
    if (filter != null) {
      console.log(`Filter: ${filter}`);
    }

    const filter_str = filter != null ? `@filter(${filter})` : "";

    query = `
        query search($vector: float32vector) {
            var(func: similar_to(${predicate},${topK},$vector))  {
                vemb as ${predicate}
                dist as math((vemb - $vector) dot (vemb - $vector))
                score as math(1 - (dist / 2.0))
            }

            f as var(func:uid(score),orderdesc:val(score))  @filter(gt(val(score),${threshold})) @cascade{
                ${criteria.join("\n")}
            }

            list(func:uid(f),orderdesc:val(score)) ${filter_str} {
                ${body}
            }

        }`;

    const vars = new dgraph.Variables();
    vars.set("$vector", JSON.stringify(embedding));

    const dgraph_query = new dgraph.Query(query, vars);

    const response = dgraph.execute(
      connection,
      new dgraph.Request(dgraph_query),
    );
    console.log(response.Json);
    return JSON.parse<ListOf<T>>(response.Json).list;
  }
  /**
   * This function is used to find similar users based on the Jaccard similarity with a intermediate node relation.
   * searchByJaccardSimilarity("dgraph", "User.display_name", "User.play", "PlayGame.game")
   */
  export function searchByJaccardSimilarity<T>(
    connection: string,
    identifier_predicate: string,
    identifier_value: string,
    relationship: string,
    target_predicate: string,
    body: string,
  ): T[] {
    let query = `
      query similar($identifier: string) {
        var(func:eq(${identifier_predicate},$identifier))  {
          m1_i as count(${relationship})
          n as math(1)
          ${relationship} {
            targets as ${target_predicate}  {
              m1 as math (m1_i / n)
            }
          }
        }
        ## items with targets in common
        var(func:uid(targets)) {
            c as Math(1.0)
            g1_i as math(m1)
            ~${target_predicate}  {
                  ~${relationship} {
                    common as math(c)
                    g1 as math(g1_i / c)
                    m2 as count(${relationship})
                    similarity as math( ( common / (g1 + m2 - common) ))
                }
            }
          }
          # scores as scores(func:uid(similarity), orderdesc: val(similarity), first:10) {
            #uid
            # intersection:val(common)
            # m1:val(g1)
            # m2:val(m2)
            # similarity: val(similarity)
          # }
          list(func:uid(similarity), orderdesc: val(similarity), first:10) {
            uid
            similarity: val(similarity)
            ${body}
          }
      }`;

    const vars = new dgraph.Variables();
    vars.set("$identifier", identifier_value);
    const dgraph_query = new dgraph.Query(query, vars);

    const response = dgraph.execute(
      connection,
      new dgraph.Request(dgraph_query),
    );
    console.log(response.Json);
    // create list of Similar<T> from response get item with uid
    const data = JSON.parse<ListOf<T>>(response.Json);
    return data.list;
  }

  export function queryWithFilter<T>(
    connection: string,
    type: string,
    body: string,
    filter: string,
    cascade_criteria: string[] = [],
  ): T[] {
    const filter_part = filter != "" ? `@filter(${filter})` : "";

    let query = "";

    query = `
        query search($type: string!) {
            n as var(func: type(${type})) ${filter_part} @cascade{
              ${cascade_criteria.join("\n")}
            }

            list(func:uid(n),first:100)  {
                ${body}
            }

        }`;
    const vars = new dgraph.Variables();
    vars.set("$type", type);
    const dgraph_query = new dgraph.Query(query, vars);

    const response = dgraph.execute(
      connection,
      new dgraph.Request(dgraph_query),
    );
    console.log(response.Json);
    return JSON.parse<ListOf<T>>(response.Json).list;
  }

  export function dqlList<T>(connection: string, dql: string): T[] {
    const dgraph_query = new dgraph.Query(dql);

    const response = dgraph.execute(
      connection,
      new dgraph.Request(dgraph_query),
    );
    console.log(response.Json);
    return JSON.parse<ListOf<T>>(response.Json).list;
  }
}
