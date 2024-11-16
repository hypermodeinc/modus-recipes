import { JSON } from "json-as"
import { dgraph } from "@hypermode/modus-sdk-as"
import { Product } from "./classes"
import {embedText} from "./embeddings"

import { injectNodeUid, NestedEntity , deleteNodePredicates, ListOf, searchBySimilarity } from "./dgraph-utils"

const DGRAPH_CONNECTION="dgraph-grpc"


export function addProduct(product: Product): Map<string, string> | null {
  
  var payload = buildProductMutationJson(DGRAPH_CONNECTION,product);

  
  const embedding = embedText([product.description]);
  payload = payload.replace("{", `{ \"Product.embedding\":\"${JSON.stringify(embedding[0])}\",`)

  const mutations: dgraph.Mutation[] = [new dgraph.Mutation(payload)];
  const uids = dgraph.execute(DGRAPH_CONNECTION, new dgraph.Request(null, mutations)).Uids;
  

  return uids;
}

function buildProductMutationJson(connection:string, product: Product): string {
  var payload = JSON.stringify(product);
  const nested_entities: NestedEntity[] = [
    { 
      predicate: "",
      type: "Product",
      id_field: "id",
      id_value: product.id
    }
  ]
  if (product.category != null) {
    nested_entities.push({
      predicate: "category",
      type: "Category",
      id_field: "name",
      id_value: product.category!.name
    });
  }
  payload = injectNodeUid(connection,payload, nested_entities);
  
  return payload;

}


export function getProductsByCategory(category: string): Product[] {
  const query = new dgraph.Query(`{
    list(func: eq(Category.name, "${category}")) {
      list:~Product.category {
        Product.id
        Product.description
        Product.category {
          Category.name
        }
      }
    }
  }`);
  const response = dgraph.execute("dgraph-grpc", new dgraph.Request(query));
  const data = JSON.parse<ListOf<ListOf<Product>>>(response.Json);
  if (data.list.length > 0) {
    return data.list[0].list;
  } 
  return [];
}

export function getProduct(id: string): Product | null{
  const query = new dgraph.Query(`{
    list(func: eq(Product.id, "${id}")) {
        Product.id
        Product.description
        Product.category {
          Category.name
        }
      }
    }`);
  const response = dgraph.execute("dgraph-grpc", new dgraph.Request(query));
  const data = JSON.parse<ListOf<Product>>(response.Json);
  if (data.list.length > 0) {
    return data.list[0];
  } 
  return null;
}

export function deleteProduct(id: string): void {
  deleteNodePredicates(DGRAPH_CONNECTION, `eq(Product.id, "${id}")`, ["Product.id", "Product.description", "Product.category"]);
}



export function searchProducts(search: string): Product[]{
  const embedding = embedText([search])[0];
  const topK = 3;
  const body = `
    Product.id
    Product.description
    Product.title
    Product.category {
      Category.name
    }
  `
  return searchBySimilarity<Product>(DGRAPH_CONNECTION,embedding,"Product.embedding",body, topK);

}




