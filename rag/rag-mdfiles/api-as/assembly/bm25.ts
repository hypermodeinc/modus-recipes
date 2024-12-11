/**
 * BM25 Ranking Algorithm
 */
import { RankedDocument } from "./ranking";
import { JSON } from "json-as";
export class Document {
  id!: string;
  content!: string;
  tokenized_content: string[] | null = null;
}

// Tokenize a text into terms
export function tokenize(text: string): string[] {
  // Implement your text tokenization logic here
  // Example: Split by whitespace and lowercase
  text = text
    .replaceAll(".", " ")
    .replaceAll(",", " ")
    .replaceAll("?", " ")
    .replaceAll("#", " ")
    .replaceAll("*", " ")
    .replaceAll("!", " ")
    .replaceAll(":", " ")
    .replaceAll(";", " ")
    .replaceAll("(", " ")
    .replaceAll(")", " ")
    .replaceAll("[", " ")
    .replaceAll("]", " ")
    .replaceAll('"', " ")
    .replaceAll("_", " ")
    .replaceAll("- ", " ")
    .replaceAll("\n", " ");
  while (text.includes("  ")) {
    text = text.replaceAll("  ", " ");
  }
  return text.trim().toLowerCase().split(" ");
}
// Calculate the term frequency of a term in a document

export function calculateTF(term: string, document: string[]): f64 {
  // Loop through the document to count occurrences of the term
  let count: f64 = 0.0;

  for (let i = 0; i < document.length; i++) {
    if (document[i] == term) {
      count += 1;
    }
  }
  return count;
}
// Calculate the inverse document frequency of a term in a set of documents
export function calculateIDF(term: string, documents: Document[]): f64 {
  // Count the number of documents that contain the term
  let relevantDocuments = 0.0;
  for (let i = 0; i < documents.length; i++) {
    if (documents[i].tokenized_content!.includes(term)) {
      relevantDocuments += 1;
    }
  }
  return Math.log(
    1.0 +
      (documents.length - relevantDocuments + 0.5) / (relevantDocuments + 0.5),
  );
}

// Calculate the average document length in a set of documents
function averageDocumentLength(documents: Document[]): f64 {
  let avgdl: f64 = 0.0;
  for (let i = 0; i < documents.length; i++) {
    avgdl += documents[i].tokenized_content!.length;
  }
  return avgdl / documents.length;
}

// Calculate the BM25 score of a document for a set of keywords
export function calculateBM25(
  keywords: string[],
  document: Document,
  documents: Document[],
  term_idf: Map<string, f64>,
  average_doc_length: f64,
  k1: f64 = 1.2,
  b: f64 = 0.75,
): f64 {
  

  let score: f64 = 0;

  for (let i = 0; i < keywords.length; i++) {
    const term = keywords[i].trim().toLowerCase();
    const tf: f64 = calculateTF(term, document.tokenized_content!);
    // console.log(`TF: ${tf}`);
    const idf = term_idf.get(term);
    // console.log(`IDF: ${idf}`);

    const docLength: f64 = document.tokenized_content!.length;

    score +=
      (idf * (tf * (k1 + 1))) / (tf + k1 * (1 - b + (b * docLength) / average_doc_length));
  }

  return score;
}

// Tokenize a set of documents
export function tokenizeDocuments(documents: Document[]): void {
  for (let i = 0; i < documents.length; i++) {
    documents[i].tokenized_content = tokenize(documents[i].content);
  }
  /*
  return documents.map<TokenizedDocument>((doc) => {
    const tokenized_content = tokenize(doc.content);
    return <TokenizedDocument>{
      id: doc.id,
      tokenized_content: tokenized_content,
    };
  });
  */
}

// Compute the TF-IDF index for a set of documents
export function compute_tf_idf_index(
  documents: Document[],
  k1: f64 = 1.2,
  b: f64 = 0.75,
): Map<string, Map<string, f64>> {
  const tfIndex = new Map<string, Map<string, f64>>();
  const idfIndex = new Map<string, f64>();
  const tfidfIndex = new Map<string, Map<string, f64>>();
  const terms = new Set<string>();
  const avgdl = averageDocumentLength(documents);
  // Calculate TF for each term in each document
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];

    const tfDoc: Map<string, f64> = new Map();
    for (let j = 0; j < doc.tokenized_content!.length; j++) {
      const term = doc.tokenized_content![j].trim().toLowerCase();
      terms.add(term);
      if (!tfDoc.has(term)) {
        tfDoc.set(term, calculateTF(term, doc.tokenized_content!));
      }
    }
    tfIndex.set(doc.id, tfDoc);
  }

  // Calculate IDF for each term in the set of terms
  const all_terms = terms.values();
  for (let i = 0; i < all_terms.length; i++) {
    const term = all_terms[i];
    idfIndex.set(term, calculateIDF(term, documents));
  }

  // Calculate TF-IDF for each term in each document
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const docLength = doc.tokenized_content!.length;
    const tfidfDoc = new Map<string, f64>();
    const terms = tfIndex.get(doc.id).keys();
    for (let i = 0; i < terms.length; i++) {
      const term = terms[i];
      const tf = tfIndex.get(doc.id).get(term);
      const idf = idfIndex.get(term);
      const score =
        (idf * (tf * (k1 + 1))) / (tf + k1 * (1 - b + (b * docLength) / avgdl));

      tfidfDoc.set(term, score);
      let map: Map<string, f64> = new Map();
      if (tfidfIndex.has(term)) {
        map = tfidfIndex.get(term);
      } else {
        tfidfIndex.set(term, map);
      }
      map.set(doc.id, score);
    }
    //if (!tfidfIndex.has(term)) tfidfIndex.set(doc.id, tfidfDoc);
  }
  console.log(JSON.stringify(tfidfIndex));

  return tfidfIndex;
}

export function rankDocuments(
  keywords: string[],
  documents: Document[],
  k1: f64 = 1.2,
  b: f64 = 0.75,
): RankedDocument[] {
  tokenizeDocuments(documents);
  const term_idf = new Map<string, f64>();
  for (let i = 0; i < keywords.length; i++) {
    const term = keywords[i].trim().toLowerCase();
    term_idf.set(term,calculateIDF(term, documents));
  }
  const average_doc_length = averageDocumentLength(documents);
  return rankTokenizedDocuments(keywords, documents, term_idf,average_doc_length, k1, b);
}

function rankTokenizedDocuments(
  keywords: string[],
  documents: Document[],
  term_idf: Map<string, f64>,
  average_doc_length: f64,
  k1: f64 = 1.2,
  b: f64 = 0.75,
  
): RankedDocument[] {
  let rankedDocuments: RankedDocument[] = [];

  // Step 1: Calculate the BM25 score for each document and store it in the rankedDocuments array
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const score = calculateBM25(keywords, doc, documents,term_idf,average_doc_length, k1, b);
    if (score > 0) {
      rankedDocuments.push(<RankedDocument>{
        id: doc.id,
        docid: "default",
        score: score,
        content: doc.content,
      });
    }
  }
  rankedDocuments = rankedDocuments.sort((a, b) => {
    return a.score < b.score ? -1 : 1;
  });

  return rankedDocuments.sort((a, b) => (b.score - a.score > 0 ? 1 : -1));
}

export function rankDocumentsV2(
  keywords: string[],
  documents: Document[],
  tfidfIndex: Map<string, Map<string, f64>>,
): RankedDocument[] {
  tokenizeDocuments(documents);
  return rankTokenizedDocumentsV2(keywords, documents, tfidfIndex);
}
/**
 * Rank a set of tokenized documents based on a set of keywords
 * This function uses a precomputed TF-IDF index for efficiency
 * The TF-IDF index is computed using the compute_tf_idf_index function
 * This is simply a test function to check the BM25 ranking algorithm with a precomputed TF-IDF index
 * The actual implementation should be done in the backend
 * The index should be computed and stored in a database or cache and reused for multiple queries
 */
function rankTokenizedDocumentsV2(
  keywords: string[],
  documents: Document[],
  tfidfIndex: Map<string, Map<string, f64>>,
): RankedDocument[] {
  const rankedDocuments: RankedDocument[] = [];

  // Step 1: Calculate the BM25 score for each document using the precomputed TF-IDF index
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const score = calculateBM25_with_index(keywords, doc, tfidfIndex);
    if (score > 0) {
      rankedDocuments.push(<RankedDocument>{
        id: doc.id,
        score: score,
        content: doc.content,
      });
    }
  }
  return rankedDocuments.sort((a, b) => (b.score - a.score > 0 ? 1 : -1));
}

// Calculate the BM25 score of a document for a set of keywords using a precomputed TF-IDF index
export function calculateBM25_with_index(
  keywords: string[],
  doc: Document,
  tf_idf_index: Map<string, Map<string, f64>>,
): f64 {
  let score: f64 = 0;

  for (let j = 0; j < keywords.length; j++) {
    const term = keywords[j].trim().toLowerCase();
    if (tf_idf_index.has(term) && tf_idf_index.get(term).has(doc.id)) {
      score += tf_idf_index.get(term).get(doc.id);
    }
  }
  return score;
}
