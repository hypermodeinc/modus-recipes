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

// Fetch movie details and recommendations as a Server Component
async function MovieDetails({
  movieId,
  searchQuery,
}: {
  movieId: string;
  searchQuery: string;
}) {
  const recommendations = await fetchMovieDetailsAndRecommendations(
    movieId,
    searchQuery
  );
  const movie = recommendations.movieDetails.data.movie[0];
  const recommendedMovies = JSON.parse(recommendations.recommendations) || [];

  if (!movie) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-100 text-red-500 text-xl">
        Movie not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Movie Details */}
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
            {movie.genre
              ?.map((genre: any) => genre["name@en"])
              .filter(Boolean)
              .join(", ") || "No genres listed"}
          </p>
          <p>
            <strong>Starring:</strong>{" "}
            {movie.starring
              ?.flatMap((star: any) =>
                star["performance.actor"]?.map((actor: any) => actor["name@en"])
              )
              .filter(Boolean)
              .slice(0, 5)
              .join(", ") || "No actors listed"}
          </p>
        </div>
      </div>

      {/* Recommendations Section */}
      {recommendedMovies.length > 0 && (
        <div>
          <h2 className="text-3xl font-semibold mb-6">Recommendations</h2>
          <div className="my-4">
            These recommendations are based on your interest in{" "}
            <strong>{movie["name@en"]}</strong>
            {searchQuery
              ? " and your search query '" + searchQuery + "'"
              : ""}. <strong>Modus</strong> combines internal data from{" "}
            <strong>Dgraph</strong> with a{" "}
            <strong>large language model (LLM)</strong>, making it easy to
            generate AI-driven insights tailored to your data.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedMovies.map((rec: any, index: number) => (
              <div
                key={index}
                className="bg-white/10 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">
                  {rec.name || "Unknown Title"}
                </h3>
                <p className="text-sm mb-1">
                  Release Year: {rec.release_date || "Unknown Year"}
                </p>
                <p className="text-sm mb-1">
                  Genres:{" "}
                  {rec.genre
                    ?.map((genre: any) => genre)
                    .filter(Boolean)
                    .join(", ") || "No genres listed"}
                </p>
                <p className="text-sm">
                  Directed By: {rec.director || "Unknown Director"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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
      <Link href="/" className="bg-white p-2 rounded text-black">
        ← Back to Movies
      </Link>
      <Suspense fallback={<LoadingSpinner />}>
        <MovieDetails movieId={movieId} searchQuery={searchQuery} />
      </Suspense>
    </div>
  );
}
