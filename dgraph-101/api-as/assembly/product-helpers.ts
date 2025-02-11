/**
 * Helper functions for products classes.
 */
import { JSON } from "json-as"
import { Product } from "./classes"
import { injectNodeUid, GraphSchema } from "./dgraph-utils"

const product_schema: GraphSchema = new GraphSchema()

product_schema.node_types.set("Product", {
  id_field: "Product.id",
  relationships: [{ predicate: "Product.category", type: "Category" }],
})
product_schema.node_types.set("Category", {
  id_field: "Category.name",
  relationships: [],
})

export function buildProductMutationJson(connection: string, product: Product): string {
  const payload = JSON.stringify(product)
  return injectNodeUid(connection, payload, "Product", product_schema)
}
