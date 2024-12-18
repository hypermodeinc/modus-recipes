# dgraph with modus 101

From ModusHack livestream - 11/19/24 .

## Dgraph

Start a local instance using Docker.

```sh
   docker run --name dgraph-101 -d -p "8080:8080" -p "9080:9080" -v ~/dgraph-101:/dgraph dgraph/standalone:latest
```

Start Ratel, a Graphical data explorer for Dgraph:

```sh
docker run --name ratel  -d -p "8000:8000"  dgraph/ratel:latest
```

## Data model

Modus is code first, simply define you data using classes. In this example we are using `Product`
and `Category` defined in `classes.ts` file.

## Define your API

index.ts is where we export the functions that are exposed as GraphQL operations.

This project defines the following operations:

- upsertProduct
- getProduct
- deleteProduct

Note that Modus is exposing `getProduct` as `product` to follow common coding and GraphQL practices.
Modus also exposes `upsertProduct` and `deleteProduct` as a GraphQL Mutation automatically.

- getProductsByCategory The data is saved in Dgraph as a graph. This function shows how to easily
  use the relationships in the graph.

- searchProducts Finally we are using an AI model to create text embeddings for our Products: as the
  embeddings are stored in Dgraph for each Product entity, we can easily expose an API to search by
  natural language and similarity, leveraging DQL `similar_to` function.
