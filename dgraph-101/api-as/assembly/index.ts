import { JSON } from "json-as"
import { dgraph } from "@hypermode/modus-sdk-as"

@json
class Product {
  @alias("Product.id")
  id: string = "";
  @alias("Product.description")
  description: string = "";

  @alias("Product.category")
  category: Category;
}

@json
class Category {
  @alias("Category.name")
  name: string = "";
}

export function addProduct(product: Product): Map<string, string> | null {
  const categoryUid = getCategoryUid(product.category)
  var payload = JSON.stringify(product);
  payload = payload
  .replace("{", "{ \"dgraph.type\":\"Product\",")
  .replace("category\":{", "category\":{ \"dgraph.type\":\"Category\",");
  if (categoryUid != null) {
    payload = payload.replace("category\":{", `category\":{ "uid":"${categoryUid}",`)
  }
  const mutations: dgraph.Mutation[] = [new dgraph.Mutation(payload)];

  // const map = new Map<string, string>();
  //map.set("json", payload);
  // return map
  return dgraph.execute("dgraph-grpc", new dgraph.Request(null, mutations)).Uids;
}
@json
class Uid {
  uid: string = "";
}
@json 
class UidResult {
  uids: Uid[] = [];
}

function getCategoryUid(category: Category): string | null{
  var payload = JSON.stringify(category);
  const query = new dgraph.Query(`{uids(func: eq(Category.name, "${category.name}")) {uid}}`);
  const response = dgraph.execute("dgraph-grpc", new dgraph.Request(query ))
  const data = JSON.parse<UidResult>(response.Json)
  if (data.uids.length == 0) {
    return null
  }
  console.log(`Category Uid: ${data.uids[0].uid}`)
  return data.uids[0].uid
}

