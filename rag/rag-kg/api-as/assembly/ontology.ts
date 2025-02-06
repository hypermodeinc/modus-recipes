import { LAB_DGRAPH } from "./dgraph-utils";
import { graphql } from "@hypermode/modus-sdk-as";
import { dgraph } from "@hypermode/modus-sdk-as";

const connection = "dgraph";
const dgraph_host = "dgraph-gql";


@json
export class Ontology {
  label: string = "";
  description: string | null = null;
  classes: Class[] = [];
  relations: Relationship[] = [];
}


@json
export class Entity {
  label: string = "";
  is_a: string = ""; // reference to a class label
  description: string | null = null;
}


@json
export class RelatedEntity {
  is_a: string = "";
  label: string = "";
  source: Entity = new Entity();
  description: string = "";
}


@json
export class Class {
  label: string = "";
  description: string = "";
}


@json
class Relationship {
  domain: string[] = [];
  range: string[] = [];
  label: string = "";
  description: string = "";
}

export function getOntologyByName(name: string): Ontology {
  const statement = `query GetKGSchema {
    a:getKGSchema(label: "${name}") {
        label
        description
        classes {
            description
            label
        }
    }
}`;

  const response = graphql.execute<LAB_DGRAPH.a<Ontology>>(
    dgraph_host,
    statement,
  );
  return response.data!.a!;
}

export function addClass(namespace: string, type: Class): string {
  // const ontology = getOntologyByName(namespace);
  const statement = `
  mutation AddKGClass {
    addKGClass(
        input: [
            {
                isDefinedBy: { label: "${namespace}" },
                label: "${type.label}",
                description: "${type.description}"
        }], upsert:true
    ) {
        numUids
    }
}
`;
  // Execute the GraphQL query using the host name and query statement
  // The API returns a response of type `CountriesResponse` containing an array of `Country` objects
  const response = graphql.execute<LAB_DGRAPH.NumUidsResult>(
    dgraph_host,
    statement,
  );
  console.log(`Response numUids: ${response.data!.numUids}`);
  return "success";
}
export function addEntities(namespace: string, entities: Entity[]): string {
  for (let i = 0; i < entities.length; i++) {
    addEntity(namespace, entities[i]);
  }
  return "Success";
}
export function addEntity(namespace: string, entity: Entity): string {
  // add entity using DQL
  const xid = `${entity.is_a}:${entity.label}`;
  const query = new dgraph.Query(`
    {
        v as var(func: eq(xid, "${xid}"))
        c as var(func: eq(<rdfs:label>,"${entity.is_a}"))
    }
    `);
  var nquads = `
    uid(v) <xid> "${xid}" .
    uid(v) <rdfs:label> "${entity.label}" .
    uid(v) <is_a> uid(c) .
    `;
  if (entity.description) {
    nquads += `uid(v) <rdfs:comment> "${entity.description!}" .`;
  }
  const mutation = new dgraph.Mutation(
    "",
    "",
    nquads,
    "",
    "@if(eq(len(c), 1))",
  );
  console.log(`Mutation: ${nquads}`);
  const response = dgraph.execute(
    connection,
    new dgraph.Request(query, [mutation]),
  );
  return response.Json;
}
export function addRelatedEntities(
  namespace: string,
  entities: RelatedEntity[],
): string {
  for (let i = 0; i < entities.length; i++) {
    addRelatedEntity(namespace, entities[i]);
  }
  return "Success";
}
export function addRelatedEntity(
  namespace: string,
  entity: RelatedEntity,
): string {
  // add entity using DQL
  const xid = `${entity.source.is_a}:${entity.source.label}`;
  const query = new dgraph.Query(`
      {
          source as var(func: eq(xid, "${xid}"))
      }
      `);
  var nquads = `
      <_:e> <entity.type> "${entity.is_a}" .
      <_:e> <source> uid(source) .
      <_:e> <rdfs:comment> "${entity.description!}" .
      `;
  const mutation = new dgraph.Mutation(
    "",
    "",
    nquads,
    "",
    "@if(eq(len(source), 1))",
  );
  console.log(`Mutation: ${nquads}`);
  const response = dgraph.execute(
    connection,
    new dgraph.Request(query, [mutation]),
  );
  return response.Json;
}
