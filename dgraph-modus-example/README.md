# Movie Recommendation App

This project demonstrates the power of **Modus** and **Dgraph** by integrating a graph database with
a large language model (LLM) to provide AI-driven movie recommendations. The app consists of a
backend (powered by Modus and Dgraph) and a frontend (built with Next.js and tailwind).

## Why Use Modus with Dgraph?

**Modus** simplifies the integration of internal data (from sources like Dgraph) with cutting-edge
LLMs. Here's why this combination is powerful:

- **Rich Data Queries**: Dgraph enables complex queries across interconnected datasets like movies,
  genres, actors, and directors. This makes it ideal for graph-based recommendations.
- **Seamless AI Integration**: Modus abstracts the complexity of using LLMs, allowing you to feed
  internal data into models and retrieve actionable insights tailored to your data.
- **Rapid Prototyping**: With Modus, you can quickly build and test serverless functions that
  combine graph-based querying and AI recommendations.
- **Customizability**: Dynamically construct prompts for LLMs using Dgraph's query results to
  generate personalized outputs, such as movie recommendations.

---

## Backend Setup

The backend is written in Go using **Modus** and **Dgraph**.

### Features

- Functions powered by Modus are integrated with a read-only Dgraph database and an LLM from Hugging
  Face.
- Provides a GraphQL endpoint for querying data locally.
- Demonstrates how to use Modus to create powerful, serverless APIs that leverage Dgraph's
  capabilities and LLM-driven insights.

### Prerequisites

- Install **Modus CLI**: Follow the
  [Modus installation guide](https://docs.hypermode.com/modus/installation).
- Ensure **Dgraph** is available or connected to the backend (the project uses a read-only Dgraph
  database).

### Running Backend Locally

Move into the `backend` directory:

    ```bash
    cd backend
    ```

Install dependencies (if required):

    ```bash
    go mod tidy
    ```

Start the backend using Modus:

    ```bash
    modus dev
    ```

Access the local endpoint:

    - GraphQL API Explorer: `http://localhost:8686/graphql`
    - Query APIs or explore the auto-generated schema directly in the explorer.

Key Notes - Functions are defined in Go and connected to a read-only Dgraph database. - The backend
integrates with an LLM to generate movie recommendations dynamically. - Check the Modus logs to see
which endpoints and functions are exposed.

---

## Frontend Setup

The frontend is built with **Next.js** and **Tailwind**.

### Frontend Features

- Search for movies by title or related fields.
- View movie details, including release year, genres, and starring actors.
- Get AI-driven recommendations for similar movies.

### Running Frontend Locally

Move into the frontend directory:

    ```bash
    cd frontend
    ```

Install dependencies:

    ```bash
    npm install
    ```

Start the development server:

    ```bash
    npm run dev
    ```

4.  Open the app in your browser: `http://localhost:3000`.

### Important

- Ensure the backend is running locally for the frontend to fetch data and generate recommendations.
- The backend API endpoints are integrated into the frontend through `actions.ts`.

---

## How It Works

1. Backend:

   - Queries Dgraph for movie data using GraphQL-like queries.
   - Dynamically generates prompts for the LLM to fetch recommendations.
   - Returns combined movie details and recommendations as a JSON response.

2. Frontend:

   - Fetches data from the backend's GraphQL endpoints.
   - Displays movie details and AI-generated recommendations.
   - Provides a clean, user-friendly interface for exploring movies and related data.

---

## Learning More

- Modus Documentation:
  [https://docs.hypermode.com/modus/overview](https://docs.hypermode.com/modus/overview)
- Dgraph Documentation: [https://dgraph.io/docs](https://dgraph.io/docs)
- Next.js Documentation: [https://nextjs.org/docs](https://nextjs.org/docs)

---

This project is an excellent starting point for understanding how to combine the strengths of
Dgraph, Modus, and LLMs to create powerful, data-driven applications. 🚀
