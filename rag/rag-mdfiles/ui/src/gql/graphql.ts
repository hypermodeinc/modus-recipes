/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  UInt: { input: any; output: any; }
};

export type Chunk = {
  __typename?: 'Chunk';
  content: Scalars['String']['output'];
  docid: Scalars['String']['output'];
  embedding?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  order: Scalars['UInt']['output'];
  type: Scalars['String']['output'];
  uid: Scalars['String']['output'];
};

export type ChunkSection = {
  __typename?: 'ChunkSection';
  children: Array<ChunkSection>;
  chunks: Array<Chunk>;
  docid: Scalars['String']['output'];
  id: Scalars['String']['output'];
  level: Scalars['UInt']['output'];
  order: Scalars['UInt']['output'];
  type: Scalars['String']['output'];
};

export type DocPage = {
  __typename?: 'DocPage';
  docid: Scalars['String']['output'];
  root: ChunkSection;
  type: Scalars['String']['output'];
};

export type DocumentInput = {
  content: Scalars['String']['input'];
  id: Scalars['String']['input'];
  tokenized_content?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type Mutation = {
  __typename?: 'Mutation';
  addMarkdownPage: Array<Chunk>;
  removePage: Scalars['String']['output'];
};


export type MutationAddMarkdownPageArgs = {
  id: Scalars['String']['input'];
  max_word?: Scalars['Int']['input'];
  mdcontent: Scalars['String']['input'];
  namespace?: Scalars['String']['input'];
};


export type MutationRemovePageArgs = {
  id: Scalars['String']['input'];
  namespace?: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  embedRagChunk: Array<Array<Scalars['Float']['output']>>;
  generateResponseFromDoc: RagResponse;
  matchingSubPages: Array<DocPage>;
  ragContext?: Maybe<RagContext>;
  rank: Array<RankedDocument>;
  rankDocuments: Array<RankedDocument>;
  rank_bm25: Array<RankedDocument>;
  recursiveCharacterTextSplitter: Array<Scalars['String']['output']>;
  splitMarkdown: DocPage;
  splitMarkdownHeaderText: Array<Chunk>;
};


export type QueryEmbedRagChunkArgs = {
  content: Array<Scalars['String']['input']>;
};


export type QueryGenerateResponseFromDocArgs = {
  namespace?: Scalars['String']['input'];
  question: Scalars['String']['input'];
  threshold?: Scalars['Float']['input'];
};


export type QueryMatchingSubPagesArgs = {
  limit?: Scalars['Int']['input'];
  namespace?: Scalars['String']['input'];
  question: Scalars['String']['input'];
  threshold?: Scalars['Float']['input'];
};


export type QueryRagContextArgs = {
  limit?: Scalars['Int']['input'];
  namespace?: Scalars['String']['input'];
  question: Scalars['String']['input'];
  threshold?: Scalars['Float']['input'];
};


export type QueryRankArgs = {
  limit?: Scalars['Int']['input'];
  namespace?: Scalars['String']['input'];
  query: Scalars['String']['input'];
  threshold?: Scalars['Float']['input'];
};


export type QueryRankDocumentsArgs = {
  b?: Scalars['Float']['input'];
  documents: Array<DocumentInput>;
  k1?: Scalars['Float']['input'];
  keywords: Array<Scalars['String']['input']>;
};


export type QueryRank_Bm25Args = {
  limit?: Scalars['Int']['input'];
  namespace?: Scalars['String']['input'];
  query: Scalars['String']['input'];
  threshold?: Scalars['Float']['input'];
};


export type QueryRecursiveCharacterTextSplitterArgs = {
  max_word: Scalars['Int']['input'];
  must_split_on?: Array<Scalars['String']['input']>;
  split_on?: Array<Scalars['String']['input']>;
  text: Scalars['String']['input'];
};


export type QuerySplitMarkdownArgs = {
  content: Scalars['String']['input'];
  id: Scalars['String']['input'];
  max_word?: Scalars['Int']['input'];
  namespace?: Scalars['String']['input'];
};


export type QuerySplitMarkdownHeaderTextArgs = {
  content: Scalars['String']['input'];
  id: Scalars['String']['input'];
  max_word?: Scalars['Int']['input'];
};

export type RagContext = {
  __typename?: 'RagContext';
  sources: Array<RagSource>;
  text: Scalars['String']['output'];
};

export type RagResponse = {
  __typename?: 'RagResponse';
  context?: Maybe<RagContext>;
  text: Scalars['String']['output'];
};

export type RagSource = {
  __typename?: 'RagSource';
  chunks: Array<Chunk>;
  docid: Scalars['String']['output'];
  text: Scalars['String']['output'];
};

export type RankedDocument = {
  __typename?: 'RankedDocument';
  content: Scalars['String']['output'];
  docid: Scalars['String']['output'];
  id: Scalars['String']['output'];
  score: Scalars['Float']['output'];
};

export type GenerateResponseFromDocQueryVariables = Exact<{
  question: Scalars['String']['input'];
}>;


export type GenerateResponseFromDocQuery = { __typename?: 'Query', generateResponseFromDoc: { __typename?: 'RagResponse', text: string, context?: { __typename?: 'RagContext', sources: Array<{ __typename?: 'RagSource', docid: string, text: string }> } | null } };


export const GenerateResponseFromDocDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GenerateResponseFromDoc"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"question"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateResponseFromDoc"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"question"},"value":{"kind":"Variable","name":{"kind":"Name","value":"question"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"context"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"docid"}},{"kind":"Field","name":{"kind":"Name","value":"text"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GenerateResponseFromDocQuery, GenerateResponseFromDocQueryVariables>;