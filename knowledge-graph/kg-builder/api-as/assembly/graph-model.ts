
@json
export class Attribute {
  name!: string;
  description!: string;
  type: string = "string";
}


@json
export class Entity {
  name!: string;
  attributes: Attribute[] = [];
}


@json
export class Relationship {
  name!: string;
  range: string[] = [];
  domain: string[] = [];
  isList: boolean = false;
}


@json
export enum AttributeType {
  STRING = 0,
  NUMBER = 1,
  DATE = 2,
  BOOLEAN = 3,
  GEO = 4,
}


@json
export class GraphModel {
  entities: Entity[] = [];
  relationships: Relationship[] = [];
}
