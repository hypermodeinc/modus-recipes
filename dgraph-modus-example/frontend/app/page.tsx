import { fetchMovies } from "./actions";

export default async function Home({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  // Extract page and search term from URL params
  const currentPage = Number(searchParams.page) || 1;
  const searchQuery = searchParams.search || "";

  // Fetch movies with pagination and search term
  const response = await fetchMovies(currentPage, searchQuery);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Movies</h1>

      {/* Search Bar */}
      <form method="GET" className="mb-6">
        <input
          type="text"
          name="search"
          placeholder="Search movies..."
          defaultValue={searchQuery}
          className="w-full p-2 border rounded mb-4"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Search
        </button>
      </form>

      {/* Movies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {response.movies.length === 0 ? (
          <p>No movies found</p>
        ) : (
          response.movies.map((movie: any) => (
            <div
              key={movie.uid}
              className="p-4 w-full rounded bg-white/10 mb-4 shadow-md"
            >
              <h2 className="text-xl font-bold">{movie["name@en"]}</h2>
              <div className="text-sm">
                {movie.initial_release_date
                  ? new Date(movie.initial_release_date).getFullYear()
                  : "N/A"}
              </div>
              <p>
                Genre:{" "}
                {movie.genre
                  ?.flatMap((genre: any) => genre["name@en"])
                  .filter(Boolean)
                  .join(", ") || "No genres listed"}
              </p>
              <p>
                Starring:{" "}
                {movie.starring
                  ?.flatMap((star: any) =>
                    star["performance.actor"]?.map(
                      (actor: any) => actor["name@en"]
                    )
                  )
                  .filter(Boolean)
                  .slice(0, 5)
                  .join(", ") || "No actors listed"}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-4 mt-6">
        {/* Previous Page */}
        {currentPage > 1 && (
          <a
            href={`?page=${currentPage - 1}&search=${encodeURIComponent(
              searchQuery
            )}`}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Previous
          </a>
        )}

        {/* Current Page Indicator */}
        <span className="px-4 py-2 bg-gray-800 text-white rounded">
          Page {currentPage}
        </span>

        {/* Next Page */}
        {response.movies.length > 0 && (
          <a
            href={`?page=${currentPage + 1}&search=${encodeURIComponent(
              searchQuery
            )}`}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Next
          </a>
        )}
      </div>
    </div>
  );
}
