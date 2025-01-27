import { searchByTerm, searchJsonByTerm } from "./dgraph-utils";
import { Ranked } from "./ranking";
import { tokenize, Document, rankDocuments } from "./bm25";

/**
 * Coupled to: Dgraph
 */

export function searchByTokenizedTerm<T>(
  connection: string,
  field: string,
  predicate: string,
  terms: string,
  body: string,
  topK: i32,
): T[] {
  const list = searchJsonByTerm<T>(
    connection,
    predicate,
    tokenize(terms).join(" "),
    body,
    topK * 100,
  );
  const documents = list.map<Document>((element) => {
    return <Document>{
      id: element.id,
      content: element[field],
    };
  });
  return documents;

  const dgraph_query = new dgraph.Query(query, vars);

  const response = dgraph.execute(connection, new dgraph.Request(dgraph_query));
  console.log(response.Json);
  return JSON.parse<ListOf<T>>(response.Json).list;
}

export function rank<T>(
  connection: string,
  predicate: string,
  terms: string,
  body: string,
  topK: i32 = 3,
): Ranked<T>[] {
  const list = searchByTerm<T>(
    connection,
    predicate,
    tokenize(terms).join(" "),
    body,
    topK * 100,
  );
  const documents = list.map<Document>((element) => {
    return <Document>{
      id: element.id,
      content: element.title,
    };
  });
  return rankDocuments(tokenize(query), documents).slice(0, topK);
}
