import { collections } from "@hypermode/modus-sdk-as";
import { RankedDocument } from "./ranking";

export function removeItemsFromCollection(
  collection_name: string,
  starts_with: string,
  namespace: string = "",
): string {
  let msg = "success";
  const namespaces = collections.getNamespaces(collection_name);
  if (namespaces.includes(namespace)) {
    const all_keys = collections.getTexts(collection_name, namespace).keys();

    for (let i = 0; i < all_keys.length; i++) {
      if (all_keys[i].startsWith(starts_with)) {
        const result = collections.remove(
          collection_name,
          all_keys[i],
          namespace,
        );
        if (!result.isSuccessful) {
          msg += result.error;
        }
      }
    }
  }
  return msg;
}

export function removeAllFromCollection(
  collection: string,
  namespace: string = "",
): string {
  const all_keys = collections.getTexts(collection, namespace).keys();
  let msg = "success";
  for (let i = 0; i < all_keys.length; i++) {
    if (all_keys[i].length > 0) {
      const result = collections.remove(collection, all_keys[i], namespace);
      if (!result.isSuccessful) {
        msg += result.error;
      }
    }
  }
  return msg;
}

export function rankCollection_vector(
  query: string,
  collection: string,
  search_method: string,
  limit: i32 = 10,
  namespace: string = "",
): RankedDocument[] {
  const response = collections.search(
    collection,
    search_method,
    query,
    limit,
    true,
    [namespace],
  );
  // create a RankedDocument array
  const rankedDocuments: RankedDocument[] = [];
  for (let i = 0; i < response.objects.length; i++) {
    rankedDocuments.push(<RankedDocument>{
      id: response.objects[i].key,
      score: response.objects[i].score,
      content: response.objects[i].text,
    });
  }
  // we don't have to slice the array because the limit is already set in the search function
  return rankedDocuments;
}
