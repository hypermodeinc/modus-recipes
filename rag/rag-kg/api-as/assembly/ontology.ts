import { LAB_DGRAPH } from "./dgraph-utils";
import { graphql } from "@hypermode/modus-sdk-as";
import { dgraph } from "@hypermode/modus-sdk-as";

const connection = "dgraph";
const dgraph_host = "dgraph-gql";


@json
export class KGSchema {
  label: string = "";
  description: string | null = null;
  classes: KGClass[] = [];
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
  subject: Entity = new Entity();
  description: string = "";
}


@json
export class RelationalEntity {
  is_a: string = "";
  label: string = "";
  subject: Entity = new Entity();
  object: Entity = new Entity();
  description: string = "";
}


@json
export class KGClass {
  role: string = "";
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

export function getKGSchemaByName(name: string): KGSchema {
  const statement = `query GetKGSchema {
    a:getKGSchema(label: "${name}") {
        label
        description
        classes {
            role
            description
            label
        }
    }
}`;

  const response = graphql.execute<LAB_DGRAPH.a<KGSchema>>(
    dgraph_host,
    statement,
  );
  return response.data!.a!;
}

export function addClass(namespace: string, type: KGClass): string {
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
  const xid = `${entity.subject.is_a}:${entity.subject.label}`;
  const query = new dgraph.Query(`
      {
          source as var(func: eq(xid, "${xid}"))
      }
      `);
  var nquads = `
      <_:e> <entity.type> "${entity.is_a}" .
      <_:e> <subject> uid(source) .
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

export function addRelationalEntities(
  namespace: string,
  entities: RelationalEntity[],
): string {
  for (let i = 0; i < entities.length; i++) {
    addRelationalEntity(namespace, entities[i]);
  }
  return "Success";
}

export function addRelationalEntity(
  namespace: string,
  entity: RelationalEntity,
): string {
  // add entity using DQL
  // assuming we can uniquelty identify a relational entity using the subject, object and the relationship:
  // unique identifier xid is
  // subject.is_a:subject.label-object.is_a-object.is_a:label
  // E.g Person:Galileo Galilei-GeospatialBody:Ganymede-AgenticEvent:discover

  const xid = `${entity.subject.is_a}:${entity.subject.label}-${entity.object.is_a}:${entity.object.label}-${entity.is_a}:${entity.label}`;
  const source_xid = `${entity.subject.is_a}:${entity.subject.label}`;
  const target_xid = `${entity.object.is_a}:${entity.object.label}`;

  const query = new dgraph.Query(`
        {
            xid as var(func: eq(xid, "${xid}"))
            source as var(func: eq(xid, "${source_xid}"))
            target as var(func: eq(xid, "${target_xid}"))
        }
        `);
  var nquads = `
        uid(xid) <entity.type> "${entity.is_a}" .
        uid(xid) <xid> "${xid}" .
        uid(xid) <subject> uid(source) .
        uid(xid) <object> uid(target) .
        uid(xid) <rdfs:label> "${entity.label}" .
        uid(xid) <rdfs:comment> "${entity.description!}" .
        `;
  const mutation = new dgraph.Mutation(
    "",
    "",
    nquads,
    "",
    "@if(eq(len(source), 1) AND eq(len(target), 1))",
  );
  console.log(`Mutation: ${nquads}`);
  const response = dgraph.execute(
    connection,
    new dgraph.Request(query, [mutation]),
  );
  return response.Json;
}
