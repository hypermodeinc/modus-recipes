import { neo4j } from "@hypermode/modus-sdk-as";

import { models } from "@hypermode/modus-sdk-as";
import { EmbeddingsModel } from "@hypermode/modus-sdk-as/models/experimental/embeddings";

import { Movie, MovieResult } from "./classes";
import { JSON } from "json-as";

// Should match the name of the Neo4j connection declared in modus.json
const hostName = "neo4j";

/**
 * Create embeddings using the minilm model for an array of texts
 */
export function generateEmbeddings(texts: string[]): f32[][] {
  const model = models.getModel<EmbeddingsModel>("minilm");
  const input = model.createInput(texts);
  const output = model.invoke(input);
  return output.predictions;
}

/**
 *
 * Create embeddings for an array of movies
 *
 */
export function getEmbeddingsForMovies(movies: Movie[]): Movie[] {
  const texts: string[] = [];

  for (let i = 0; i < movies.length; i++) {
    texts.push(movies[i].plot);
  }

  const embeddings = generateEmbeddings(texts);

  for (let i = 0; i < movies.length; i++) {
    movies[i].embedding = embeddings[i];
  }

  return movies;
}

/**
 *
 * Update movie nodes in Neo4j with generated embeddings and create a vector index
 */
export function saveEmbeddingsToNeo4j(): Movie[] {
  // TODO: find all movies without embeddings
  // TODO: batch into groups of 100 and generate embeddings
  // TODO: update neo4j in batches

  const query = `
  MATCH (m:Movie) 
  WHERE m.imdbRating > 6.0
  RETURN m.imdbRating AS rating, m.title AS title, m.plot AS plot, m.imdbId AS id
  ORDER BY m.imdbRating DESC
  LIMIT 100`;

  const result = neo4j.executeQuery(hostName, query);

  const movies: Movie[] = [];

  for (let i = 0; i < result.Records.length; i++) {
    const record = result.Records[i];
    const plot = record.getValue<string>("plot");
    const rating = record.getValue<f32>("rating");
    const title = record.getValue<string>("title");
    const id = record.getValue<string>("id");
    movies.push(new Movie(id, title, plot, rating));
  }

  const embeddedMovies = getEmbeddingsForMovies(movies);

  const vars = new neo4j.Variables();
  vars.set("movies", embeddedMovies);

  const updateQuery = `
  UNWIND $movies AS embeddedMovie
  MATCH (m:Movie {imdbId: embeddedMovie.id})
  SET m.embedding = embeddedMovie.embedding
  `;

  const updateResult = neo4j.executeQuery(hostName, updateQuery, vars);

  const indexQuery =
    "CREATE VECTOR INDEX `movie-index` IF NOT EXISTS FOR (m:Movie) ON (m.embedding)";

  const indexResult = neo4j.executeQuery(hostName, indexQuery);
  return embeddedMovies;
}

/**
 * Given a movie title, find similar movies using vector search based on the movie embeddings
 */
export function findSimilarMovies(title: string, num: i16): MovieResult[] {
  const vars = new neo4j.Variables();
  vars.set("title", title);
  vars.set("num", num);

  const searchQuery = `
  MATCH (m:Movie {title: $title})
  WHERE m.embedding IS NOT NULL
  CALL db.index.vector.queryNodes('movie-index', $num, m.embedding)
  YIELD node AS searchResult, score
  RETURN COLLECT({
    movie: {
      title: searchResult.title,
      plot: searchResult.plot,
      rating: searchResult.imdbRating,
      id: searchResult.imdbId
    },
    score: score
    }) AS movieResults
  `;

  const result = neo4j.executeQuery(hostName, searchQuery, vars);

  const movieResults: MovieResult[] = JSON.parse<MovieResult[]>(
    result.Records[0].get("movieResults"),
  );

  return movieResults;
}
