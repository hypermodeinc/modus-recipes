import { JSON } from "json-as"
import { dgraph } from "@hypermode/modus-sdk-as"
import { Product } from "./classes"
import { embedText } from "./embeddings"
import { buildProductMutationJson } from "./product-helpers"
import {
  deleteNodePredicates,
  ListOf,
  searchBySimilarity,
  getEntityById,
  addEmbeddingToJson,
} from "./dgraph-utils"

const DGRAPH_CONNECTION = "dgraph-grpc"

/**
 * Add or update a new product to the database
 */
export function upsertProduct(product: Product): Map<string, string> | null {
  let payload = buildProductMutationJson(DGRAPH_CONNECTION, product)

  const embedding = embedText([product.description])[0]
  payload = addEmbeddingToJson(payload, "Product.embedding", embedding)

  const mutation = new dgraph.Mutation(payload)
  const response = dgraph.executeMutations(DGRAPH_CONNECTION, mutation)

  return response.Uids
}

/**
 * Get a product info by its id
 */
export function getProduct(id: string): Product | null {
  const body = `
    Product.id
    Product.description
    Product.title
    Product.category {
      Category.name
    }`
  return getEntityById<Product>(DGRAPH_CONNECTION, "Product.id", id, body)
}
/**
 * Delete a product by its id
 */

export function deleteProduct(id: string): void {
  deleteNodePredicates(DGRAPH_CONNECTION, `eq(Product.id, "${id}")`, [
    "Product.id",
    "Product.description",
    "Product.category",
  ])
}

/**
 * Get all products of a given category
 */
export function getProductsByCategory(category: string): Product[] {
  const query = new dgraph.Query(`{
    list(func: eq(Category.name, "${category}")) {
      list:~Product.category {
        Product.id
        Product.title
        Product.description
        Product.category {
          Category.name
        }
      }
    }
  }`)
  const response = dgraph.executeQuery(DGRAPH_CONNECTION, query)
  const data = JSON.parse<ListOf<ListOf<Product>>>(response.Json)
  if (data.list.length > 0) {
    return data.list[0].list
  }
  return []
}

/**
 * Search products by similarity to a given text
 */
export function searchProducts(search: string): Product[] {
  const embedding = embedText([search])[0]
  const topK = 3
  const body = `
    Product.id
    Product.description
    Product.title
    Product.category {
      Category.name
    }
  `
  return searchBySimilarity<Product>(DGRAPH_CONNECTION, embedding, "Product.embedding", body, topK)
}
