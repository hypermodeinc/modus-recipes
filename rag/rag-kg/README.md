# Knowledge Graph

### Dgraph queries

```graphql
{
      class(func: has(<rdfs:isDefinedBy>)) {
        uid
        name:<rdfs:label>
        <rdfs:comment>
        namespace:<rdfs:isDefinedBy> { uid }

      }
      data(func:has(is_a)) {
        name:<rdfs:label>
        <rdfs:comment>
        is_a { <rdfs:label> }

      }
      fact(func:eq(entity.type,"Fact")) {
         name:<rdfs:label>
        <rdfs:comment>
        type:entity.type
        source { <rdfs:label> }

      }
      characteristic(func:eq(entity.type,"Characteristic")) {
         name:<rdfs:label>
        <rdfs:comment>
        type:entity.type
        source { <rdfs:label> }

      }

    }
```
