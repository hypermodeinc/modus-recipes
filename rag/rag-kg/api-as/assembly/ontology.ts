import { LAB_DGRAPH } from "../../../../utils/as/dgraph-utils";

const connection = "dgraph";


@json
export class Ontology {
  namespace: string = "";
  description: string = "";
  entities: Entity[] = [];
  relations: Relationship[] = [];
}


@json
class Entity {
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
  const query = `{
        list(func: eq(<rdfs:label>, "${name}")) {
            namespace:<rdfs:label>
            entities:<hypermode.entity> {
                label:<rdfs:label>
                description:<rdfs:comment>
            }
        }
    }`;

  const ontologies = LAB_DGRAPH.getEntityList<Ontology>(connection, query);
  return ontologies[0];
}
