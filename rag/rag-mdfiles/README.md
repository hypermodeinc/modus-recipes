# RAG on mdfiles

## References

Modus is a framework for building AI powered API. In an Modus project, exported functions from
`functions/assembly/index.ts` are immediately available as a scalable GraphQL API, allowing direct
integration of your AI logic into your existing applications.

Each function can use AI models inferences, data connections (HTTP, GraphQL, DB, ...), collections (
a flexible vector search abstraction) and custom logic.

For more information on functions, models, connections, collections and project configuration,
consult [our documentation](https://docs.hypermode.com).

## RAG use case

This templates illustrates a type of Retrieval Augmented Generation (RAG) use case.

For this use case we want to expose 2 main API functions

- addMarkdownDocument(id: string, mdcontent: string): this API allows user to submit a markdown file
  to the system. The function splits the text into chunks based on markdown headers and save each
  chunk with an associated vector embedding as the hierarchical structure.

- generateResponseFromDoc(question: string): the function produces a text response to a natural
  language question about the documents stored in the knowledge graph.

Additionally

- getRagContext(question: string) : returns the extracted information used for the RAG context.

## Design

### Models

We are using

- `sentence-transformers/all-MiniLM-L6-v2` for the embedding
- `meta-llama/Meta-Llama-3.1-8B-Instruct` for text generation All models are shared models hosted by
  Hypermode.

Login to Hypermode to get access to those model before running this project locally.

> npm install -g @hypermode/hyp-cli hyp login

### API

> cd api-as modus dev It will compile the code and start Modus locally. Modus servers the API on
> GraphQL endpoints http://localhost:8686/graphql

### Lexical Graph

We are using Dgraph to store the hierarchy of chunks, index vector embeddings and search by
similarity.

To start a local instance:

> cd extras make up

Create indexes in Dgraph

> make schema-dql

## Sample data

An example is provided in the `extras` folder using a python graphql client. It contains

- some markdown files
- a python script to load those files using the project GraphQL API.
- a python script to submit some questions using `askTheDoc` query and to see the generated
  responses.

### load the sample data

- have python installed (3.11)
- open a terminal window and access the `extras` directory.
  > cd extras pip install -r requirements.txt python loadData.py

Command output:

```sh
 > python loadData.py
Document info.md added successfully in namespace SOLAR. 44 chunks added.

```

### Testing

Use the Chat Frontend

```bash
cd frontend
export DGRAPH_GRPC=http://localhost:8686/graphql
pnpm i && pnpm run dev
```

Access the UI at `http://localhost:3000`

Example of queries "which planet has rings?", "What is the difference between Venus and Saturn?",

## Next

You may want to experiment different models. Example, using OpenAI gpt-4o In `modus.json` change the
text-generator

```
 "text-generator": {
      "sourceModel": "meta-llama/Meta-Llama-3.1-8B-Instruct",
      "connection": "hypermode",
      "provider": "hugging-face"
    },
```

update the configuration

```
 "text-generator": {
      "sourceModel": "gpt-4o",
      "connection": "openai",
      "path": "v1/chat/completions"
    },
```

add a file `.env.dev.local` in the api-as directory to set your OpeanAI API key

```
MODUS_OPENAI_API_KEY="sk-...."
```

## Design notes

### md file chunking

We are using a simple strategy consisting of splitting the markdown files based on headers level 1
to 5.

### storage and embeddings

Each Page is stored as a hierarchy of Sections and chunks. Each chunk is added to Dgraph as a An
embedding is computed for with every chunk. The embedding function uses the model `minilm`.

### context generation

When receiving a question, we compute a vector embedding and search for the most similar document
chunk. We build a context by aggregating the content of the chunk, the parent section and all
section 'above' in the document. The idea here, is that a piece of text (chunk) in, let's say, a
Header 3 section of a document is better understood when considering the text of the associated
Header 2 and Header 1 sections of the markdown file. This `parent context` is a good tradeoff
between the chunk content only and the complete document that could be large.

### response generation

The response is generated using an LLM, in our case openai, which is also declared in the manifest
file (hypermode.json). We prompt the LLM to generate a response based on the document context.

## Design Notes

Recursive query to get the page sections and chunks See in chunk_drgraph.ts

## DQL

To Visualize the documents in Ratel:

```graphql
# showing the pages and the trees

{
  docs(func:type(DocPage)) @recurse(depth:6) {
    label:DocPage.id
    root:DocPage.root
    name:ChunkSection.id
    children:ChunkSection.children
    chunks:ChunkSection.chunks
    uid Chunk.id
    Chunk.content
  }
}
```
