import { JSON } from "json-as"
import { embedText } from "./embeddings";
import { dgraph } from "@hypermode/modus-sdk-as";
import {searchBySimilarity} from "./dgraph-utils"

const DGRAPH_CONNECTION = "dgraph";

@json
class Project {
  @alias("dgraph.type")
  type: string | null = "Project";
  @alias("uid") @omitnull()
  id: string | null = null;
  @alias("Project.title")
  title!: string;
  @alias("Project.category") @omitnull()
  category: Category | null = null
  @alias("Project.embedding") @omitnull()
  embedding: string | null = null
}



@json
class Category {
  @alias("dgraph.type")
  type: string | null = "Category";
  @alias("uid") @omitnull()
  id: string | null = null;
  @alias("Category.name")
  name!: string;
  @alias("Category.embedding") @omitnull()
  embedding: f32[] | null = null
}
export function addProject( input: Project[]): Map<string, string>|null {
  const uids = new Map<string, string>();
  // add dgraph.type and embedding to each project
  for (let i=0; i < input.length; i++) {
    const project = input[i];
    project.type = 'Project';
    project.embedding = JSON.stringify(embedText([project.title])[0]);
  }
  const payload = JSON.stringify(input);
  const mutations: dgraph.Mutation[] = [new dgraph.Mutation(payload)];
  const res = dgraph.execute(DGRAPH_CONNECTION, new dgraph.Request(null, mutations));

  return res.Uids;
}


/**
 * Search projects by similarity to a given text
 */
export function searchProjects(search: string): Project[]{
  const embedding = embedText([search])[0];
  const topK = 3;
  const body = `
    uid
    Project.title
    Project.category {
      Category.name
    }
  `
  return searchBySimilarity<Project>(DGRAPH_CONNECTION,embedding,"Project.embedding",body, topK, 0.5);
}