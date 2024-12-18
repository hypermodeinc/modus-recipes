
## RAG on mdfiles


### References

Modus is a framework for building AI powered API.
In an Modus project, exported functions from `functions/assembly/index.ts` are immediately available as a scalable GraphQL API, allowing direct integration of your AI logic into your existing applications.

Each function can use AI models inferences, data connections (HTTP, GraphQL, DB, ...), collections ( a flexible vector search abstraction) and custom logic.

For more information on functions, models, connections, collections and project configuration, consult [our documentation](https://docs.hypermode.com).



### RAG use case

This templates illustrates a type of  Retrieval Augmented Generation (RAG) use case.

For this use case we want to expose 2 main API functions

- addMarkdownPage(id: string, mdcontent: string): this API allows user to submit a markdown file to the system. The function splits the text into chunks based on markdown headers and save each chunk with an associated vector embedding as the hierarchical structure.

- askTheDoc(question: string): the function produces a text response to a natural language question about the documents stored in the knowledge graph.

Additionally
- getRagContext(question: string) : returns the extracted information used for the RAG context.


### Sample data

An example is provided in the `extras` folder using a python graphql client.
It contains

- some markdown files 
- a python script to load those files using the project GraphQL API.
- a python script to submit some questions using `askTheDoc` query and to see the generated responses.


#### load the sample data.

- have python installed (3.11)
- open a terminal window and access the `extra` directory.
- `pip install -r requirements.txt` to install the graphql client package.


```sh
python loadData.py
```

Command output:

```sh
 > python loadData.py 
Document info.md added successfully in namespace SOLAR. 44 chunks added.

```

#### testing some questions

```

```

## Design notes

### md file chunking

We are using a simple strategy consisting of splitting the markdown files based on headers level 1 to 5.

### storage and embeddings
Each Page is strored as a hierarchy of Sections and chuncks.
Each chunk is added to Dgraph as a
An embedding is computed for with every chunck. The embedding function uses the model `minilm`.


### context generation

When receiving a question, we compute a vector embedding and search for the most similar document chunk. We build a context by aggregating the content of the chunck, the parent section and all section 'above' in the document.
The idea here, is that a piece of text (chunk) in, let's say, a Header 3 section of a document is better understood when considering the text of the associated Header 2 and Header 1 sections of the markdown file. This `parent context` is a good tradeoff between the chunk content only and the complete document that could be large.

### response generation

The response is generated using an LLM, in our case openai, which is also declared in the manifest file (hypermode.json).
We prompt the LLM to generate a response based on the document context.

## Modus design card

The main components of you Modus project are visible on the [Hypermode console](https://hypermode.com/) when the project is deployed.

Functions

- addDocPage
- askTheDoc

Models

- sentence-transformers/all-MiniLM-L6-v2
- openai gpt-4o

Connections

- Dgraph

## Design Notes

Recursive query to get the page sections and chunks 
See in chunk_drgraph.ts


## Design Ideas
### Adding ranking on terms


use anyofterms + allofterms
- Get a list of matches
- get list of terms in the search
- compute frequency
- TF-IDF for each -> rank
Note all the all of terms match should be first with equal score.


## DQL 

```
# showing the pages and the trees
{
   docs(func:type(DocPage)) @recurse(depth:6) {
      label:DocPage.id
      root:DocPage.root
      name:ChunkSection.id
      children:ChunkSection.children
      chunks:ChunkSection.chunks
      Chunk.id
   }
  
}
```