import { searchByTerm, searchJsonByTerm } from "./dgraph-utils";

/**
 * Collection
 */

export class Collection<T> {
  connection: string;
  payload_body: string;
  constructor(connection: string, payload_body: string) {
    this.connection = connection;
    this.payload_body = payload_body;
  }
  /* vector_field is the searchMethod */
  search(searchMethod: string, term: string, topK: i32, threshold: f32): T[] {
    return searchJsonByTerm<T>(this.connection, field, entity, term, "", topK);
  }
}
