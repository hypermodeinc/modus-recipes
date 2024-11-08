class Param {
    type: string = "object";
    properties: Map<string, Param> | null = null;
    enum: string[] | null = null;
    required: string[] | null = null;
    additionalProperties: boolean = false;
  }