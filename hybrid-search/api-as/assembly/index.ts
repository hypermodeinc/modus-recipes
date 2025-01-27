import { searchByTerm, searchJsonByTerm } from "./dgraph-utils";
import { tokenize, Document, rankDocuments } from "./bm25";
import { RankedDocument } from "./ranking";
const DGRAPH_CONNECTION = "dgraph-grpc";


@json
class Project {

  @alias("Project.id")
  id!: string;


  @alias("Project.title")
  title: string = "";
}

/**
 * Search Projects by similarity to a given text
 */
export function searchProject(query: string, topK: i32 = 3): Project[] {
  const body = `
    Project.id
    Project.title
  `;
  const list = searchByTerm<Project>(
    DGRAPH_CONNECTION,
    "Project.title",
    tokenize(query).join(" "),
    body,
    topK * 100,
  );
  /*
  const documents = list.map<Document>((element) => {
    return <Document>{
      id: element.id,
      content: element.title}})
  return rankDocuments(tokenize(query), documents).slice(0, topK);
  */
  return list;
}
