import { Suspense } from "react";
import { fetchMovieDetailsAndRecommendations } from "@/app/actions";
import Link from "next/link";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-neutral-300"></div>
    </div>
  );
}

type Movie = {
  "name@en": string;
  initial_release_date?: string;
  genre?: { "name@en": string }[];
  starring?: { "performance.actor": { "name@en": string }[] }[];
};

type Recommendations = string;

type MovieDetailsResponse = {
  movieDetails: string;
  recommendations: Recommendations;
};

async function MovieDetails({
  movieId,
  searchQuery,
}: {
  movieId: string;
  searchQuery: string;
}) {
  const recommendations: MovieDetailsResponse =
    await fetchMovieDetailsAndRecommendations(movieId, searchQuery);
  const movieParsed = JSON.parse(recommendations.movieDetails);
  const movie: Movie | undefined = movieParsed.data.movie[0];

  if (!movie) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-100 text-red-500 text-xl">
        Movie not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MovieCard movie={movie} />
      <h2 className="text-3xl font-semibold mb-6">Recommendations</h2>
      <div className="my-4">
        These recommendations are based on your interest in{" "}
        <strong>{movie["name@en"]}</strong>
        {searchQuery
          ? " and your search query '" + searchQuery + "'"
          : ""}. <strong>Modus</strong> combines internal data from{" "}
        <strong>Dgraph</strong> with a{" "}
        <strong>large language model (LLM)</strong>, making it easy to generate
        AI-driven insights tailored to your data.
      </div>
      <Recommendations recommendations={recommendations.recommendations} />
    </div>
  );
}

function MovieCard({ movie }: { movie: Movie }) {
  return (
    <div className="bg-white/10 rounded-lg shadow-md p-6">
      <h1 className="text-4xl font-semibold mb-4">{movie["name@en"]}</h1>
      <div className="text-lg space-y-2">
        <p>
          <strong>Release Year:</strong>{" "}
          {movie.initial_release_date
            ? new Date(movie.initial_release_date).getFullYear()
            : "N/A"}
        </p>
        <p>
          <strong>Genre:</strong>{" "}
          {movie.genre?.map((genre) => genre["name@en"]).join(", ") ||
            "No genres listed"}
        </p>
        <p>
          <strong>Starring:</strong>{" "}
          {getStarringActors(movie.starring) || "No actors listed"}
        </p>
      </div>
    </div>
  );
}

function getStarringActors(starring?: Movie["starring"]): string | null {
  if (!starring) return null;

  const actors = starring
    .flatMap((s) => s["performance.actor"]?.map((actor) => actor["name@en"]))
    .filter(Boolean);

  return actors.length > 0 ? actors.slice(0, 5).join(", ") : null;
}

function Recommendations({ recommendations }: { recommendations: string }) {
  return (
    <div
      className="prose prose-invert max-w-none bg-white/10 p-6 rounded"
      dangerouslySetInnerHTML={{ __html: recommendations }}
    />
  );
}

export default function MoviePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
}) {
  const movieId = params.id;
  const searchQuery = searchParams.search || "";

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <Link
        href="/"
        className="bg-blue-500 p-2 rounded text-white hover:bg-blue-400"
      >
        ← Back to Movies
      </Link>
      <Suspense fallback={<LoadingSpinner />}>
        <MovieDetails movieId={movieId} searchQuery={searchQuery} />
      </Suspense>
    </div>
  );
}
