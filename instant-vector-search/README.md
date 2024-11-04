# instant-vector-search

A simplified template demonstrating how to build instant vector search using Hypermode and Modus. This project showcases how to configure collections, embed data, and deploy APIs to perform real-time vector search with minimal setup.

## Guide

Check out the guide on how to create a project using this template:
[Instant Vector Search Guide](TODO)

## Semantic Search in Action

This template demonstrates how instant vector search can enhance your application by generating embeddings from user queries and performing vector searches in less than 200ms.

## How to Use the Template

Fork or clone this repository to get started:

```
git clone https://github.com/hypermodeinc/instant-vector-search.git
cd instant-vector-search
```

Install Modus CLI:

```
npm install -g @hypermode/modus-cli
```

## Initialize and deploy your app:

You can deploy using either the Hypermode Console or Hyp CLI.

Option 1: Hypermode Console

- Create a new project in the Hypermode Console.
- Connect your GitHub account and select your repository to import.

Option 2: Hyp CLI

- Run the following command to import and deploy your app:

```
hyp init
```

## Uploading Data

Once your app is deployed, upload your data to the texts collection to enable vector search.

From the Hypermode Console: Upload a CSV directly using the dashboard.

Using the `upsertTexts` function: Upload data programmatically by calling the function from your code.

Once your data is in place, the embeddings will be generated automatically, and your system will be ready to handle real-time vector searches.

## Making API Calls

You can test the API via the Query page in the Hypermode Console. Run a sample vector search query:

```
query {
  search(query: "your search term here")
}
```

## Hypermode & Modus Overview

This template leverages Hypermode and Modus to power your backend functions:

[Hypermode](https://docs.hypermode.com/introduction) is a managed service that provides the infrastructure and tools for creating AI-powered applications, including assistants, APIs, and backend services. It offers:

- Automatic building and deployment of functions with each git push
- A live, scalable API for previewing, testing, and production
- Access to various AI models for experimentation
- Integrated console for observability and control
- GraphQL API generation for easy integration

[Modus](https://docs.hypermode.com/modus/overview) is an open-source, serverless framework that’s part of the Hypermode ecosystem. It focuses on:

- Building functions and APIs using WebAssembly
- Supporting multiple programming languages (currently Go and AssemblyScript)
- Providing features to integrate models, data, and external services
- Scaling from simple CRUD operations to complex AI systems
