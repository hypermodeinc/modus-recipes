const json_schema = `
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "entities": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "The identifier of the entity"
          },
          "type": {
            "type": "string",
            "description": "entity type"
          },
          "description": {
            "type": "string",
            "description": "A short description"
          },
        },
        "required": ["id", "description"],
        "additionalProperties": false
      }
    }
  },
  "required": ["entities"],
  "additionalProperties": false
}`;
