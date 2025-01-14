import { neo4j } from "@hypermode/modus-sdk-as"
import { models } from "@hypermode/modus-sdk-as"
import { EmbeddingsModel } from "@hypermode/modus-sdk-as/models/experimental/embeddings"
import { Movie, MovieResult } from "./classes"
import { JSON } from "json-as"

// Should match the name of the Neo4j connection declared in modus.json
const hostName = "neo4j"

/**
 * Create embeddings using the minilm model for an array of texts
 */
export function generateEmbeddings(texts: string[]): f32[][] {
  const model = models.getModel<EmbeddingsModel>("minilm")
  const input = model.createInput(texts)
  const output = model.invoke(input)
  return output.predictions
}

/**
 *
 * Create embeddings for an array of movies
 *
 */
export function getEmbeddingsForMovies(movies: Movie[]): Movie[] {
  const texts: string[] = []

  for (let i = 0; i < movies.length; i++) {
    texts.push(movies[i].plot)
  }

  const embeddings = generateEmbeddings(texts)

  for (let i = 0; i < movies.length; i++) {
    movies[i].embedding = embeddings[i]
  }

  return movies
}

/**
 *
 * Update movie nodes in Neo4j with generated embeddings and create a vector index
 *
 */
export function saveEmbeddingsToNeo4j(count: i32 = 100): i32 {
  const query = `
  MATCH (m:Movie) 
  WHERE m.embedding IS NULL AND m.plot IS NOT NULL AND m.imdbRating > 0.0
  RETURN m.imdbRating AS rating, m.title AS title, m.plot AS plot, m.imdbId AS id
  ORDER BY m.imdbRating DESC
  LIMIT toInteger($count)`

  const countVars = new neo4j.Variables()
  countVars.set("count", count)
  const result = neo4j.executeQuery(hostName, query, countVars)

  const movies: Movie[] = []

  // Here we iterate through each row returned and explicitly access each column value
  // An alternative would be to return an object from the Cypher query and use JSON.parse to handle type marshalling
  // see findSimilarMovies function below for an example of this approach
  for (let i = 0; i < result.Records.length; i++) {
    const record = result.Records[i]
    const plot = record.getValue<string>("plot")
    const rating = record.getValue<f32>("rating")
    const title = record.getValue<string>("title")
    const id = record.getValue<string>("id")
    movies.push(new Movie(id, title, plot, rating))
  }

  // Batch calls to embedding model in chunks of 100

  const movieChunks: Movie[][] = []
  for (let i = 0; i < movies.length; i += 100) {
    movieChunks.push(movies.slice(i, i + 100))
  }

  for (let i = 0, len = movieChunks.length; i < len; i++) {
    let movieChunk = movieChunks[i]

    // Generate embeddings for a chunk of movies
    const embeddedMovies = getEmbeddingsForMovies(movieChunk)

    // Update the Movie.embedding property in Neo4j with the new embedding values
    const vars = new neo4j.Variables()
    vars.set("movies", embeddedMovies)

    const updateQuery = `
  UNWIND $movies AS embeddedMovie
  MATCH (m:Movie {imdbId: embeddedMovie.id})
  SET m.embedding = embeddedMovie.embedding
  `

    neo4j.executeQuery(hostName, updateQuery, vars)
  }

  // Create vector index in Neo4j to enable vector search on Movie embeddings
  const indexQuery =
    "CREATE VECTOR INDEX `movie-index` IF NOT EXISTS FOR (m:Movie) ON (m.embedding)"

  neo4j.executeQuery(hostName, indexQuery)

  return movies.length
}

/**
 * Given a movie title, find similar movies using vector search based on the movie embeddings
 */
export function findSimilarMovies(title: string, num: i16): MovieResult[] {
  const vars = new neo4j.Variables()
  vars.set("title", title)
  vars.set("num", num)

  const searchQuery = `
  MATCH (m:Movie {title: $title})
  WHERE m.embedding IS NOT NULL
  CALL db.index.vector.queryNodes('movie-index', $num, m.embedding)
  YIELD node AS searchResult, score
  WITH * WHERE searchResult <> m
  RETURN COLLECT({
    movie: {
      title: searchResult.title,
      plot: searchResult.plot,
      rating: searchResult.imdbRating,
      id: searchResult.imdbId,
      poster: searchResult.poster,
      actors: [(searchResult)<-[:ACTED_IN]-(a:Actor) | a.name],
      genres: [(searchResult)-[:IN_GENRE]->(g:Genre) | g.name]
    },
    score: score
    }) AS movieResults
  `

  const results = neo4j.executeQuery(hostName, searchQuery, vars)
  let movieResults: MovieResult[] = []

  if (results.Records.length > 0) {
    const recordResults = results.Records[0].get("movieResults")
    movieResults = JSON.parse<MovieResult[]>(recordResults)
  }

  return movieResults
}
