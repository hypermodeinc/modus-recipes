
## RAG on mdfiles
```
export MODUS_DB=postgresql://postgres:postgres@localhost:5433/my-runtime-db?sslmode=disable
```

### References

Modus is a framework for building AI powered API.
In an Modus project, exported functions from `functions/assembly/index.ts` are immediately available as a scalable GraphQL API, allowing direct integration of your AI logic into your existing applications.

Each function can use AI models inferences, data connections (HTTP, GraphQL, DB, ...), collections ( a flexible vector search abstraction) and custom logic.

For more information on functions, models, connections, collections and project configuration, consult [our documentation](https://docs.hypermode.com).



### RAG use case

This templates illustrates a type of  Retrieval Augmented Generation (RAG) use case.

For this use case we want to expose 2 main API functions

- addMarkdownPage(id: string, mdcontent: string, namespace: string): this API allows user to submit a markdown file to the system. The function splits the text into chunks based on markdown headers and save each chunk with an associated vector embedding.

- askTheDoc(question: string, namespace: string): the function produces a text response to a natural language question about the documents stored in the namespace.


### Sample data

An example is provided in the `extra` folder using a python graphql client.
It contains

- some markdown files from Hypermode documentation
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
Document manifest.mdx added successfully
Document deploy.mdx added successfully
Document define-models.mdx added successfully
Document define-hosts.mdx added successfully
Document introduction.mdx added successfully
Document define-collections.mdx added successfully
Document define-schema.mdx added successfully
Document function-observability.mdx added successfully
Document quickstart.mdx added successfully
```

#### testing some questions

```
> python submitQuestions.py


What can I do with Hypermode?
Response generated from introduction.mdx

You can build AI features and assistants for your applications using Hypermode.

Hypermode provides an easy-to-use Functions SDK combined with a powerful runtime, allowing you to put your first features into production within hours without needing data. It also enables you to launch projects quickly with a large language model and automatically build a training dataset to fine-tune a small, open-source model.


In which file should I configure a host?
Response generated from define-models.mdx > . > ## Auto-deployed models

You should configure a host in the `hypermode.json` file.

In the `hypermode.json` file, you can define models and specify their host under the `models` object.


Provide an example of hypermode.json file
Response generated from define-models.mdx

Sure, here's an example of a `hypermode.json` file:

{
  "models": {
    "sentiment-classifier": {
      "task": "classification",
      "sourceModel": "distilbert/distilbert-base-uncased-finetuned-sst-2-english",
      "provider": "hugging-face",
      "host": "hypermode"
    }
  }
}
```

## Design notes

### md file chunking

We are using a simple strategy consisting of splitting the markdown files based on headers level 1 to 5.

Each chunk is identified using the document identifier followed by the chunk hierarchy in the document.

### storage and embeddings

Each chunk is added to an hypermode `collection`.
The collection applies an embedding function to associate a vector with the chunk content. The embedding function uses the model `minilm`.
The collection and the model `minilm` are both declared in the manifest file (hypermode.json).

### context generation

When receiving a question, we compute a vector embedding and search for the most similar document chunk. We build a context by aggregating the content of all chunk's parent recursively.
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

Collections

- use one collection named "ragchunks"

Connections

- no connections used in this project.