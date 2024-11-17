/**
 * Helper functions for products classes.
 */
import { JSON } from "json-as"
import { Product } from "./classes"
import { injectNodeUid, NestedEntity   } from "./dgraph-utils"

export function buildProductMutationJson(connection:string, product: Product): string {
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