export {
  generateResponseFromDoc,
  deleteMarkdownDocument,
  getMarkdownDocument,
  addMarkdownDocument,
  getRagContext,
  rank,
} from "./rag"

export { embedRagChunk } from "./embeddings"
export { splitMarkdown, splitMarkdownHeaderText } from "./markdown-splitters"
/**
 * expose some functions for testing purposes
 */
export { mergeSplits, recursiveCharacterTextSplitter } from "../../../../utils/as/text-splitters"
