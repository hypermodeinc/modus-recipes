import { fetchMovieById, fetchRecommendations } from "@/app/actions";

export default async function MoviePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const movieId = (await params).id;
  const searchQuery = (await searchParams).search || "";

  console.log(searchQuery);
  const rsponse = await fetchMovieById(movieId);
  const movie = rsponse.movie;
  const recommendations = await fetchRecommendations(
    movie["name@en"],
    searchQuery
  );
  console.log(recommendations);
  if (!movie) {
    return <div className="p-6 text-red-500">Movie not found</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">{movie["name@en"]}</h1>
      <p className="mb-2">
        <strong>Release Year:</strong>{" "}
        {movie.initial_release_date
          ? new Date(movie.initial_release_date).getFullYear()
          : "N/A"}
      </p>
      <p className="mb-2">
        <strong>Genre:</strong>{" "}
        {movie.genre
          ?.map((genre: any) => genre["name@en"])
          .filter(Boolean)
          .join(", ") || "No genres listed"}
      </p>
      <p className="mb-2">
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
  );
}
