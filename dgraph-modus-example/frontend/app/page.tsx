import { fetchMovies } from "./actions"
import Link from "next/link"

type SearchParams = {
  page?: string
  search?: string
}

type Movie = {
  uid: string
  "name@en": string
  initial_release_date?: string
  genre?: { "name@en": string }[]
  starring?: { "performance.actor": { "name@en": string }[] }[]
}

type Response = {
  movies: Movie[]
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const currentPage = Number(searchParams.page) || 1
  const searchQuery = searchParams.search || ""

  const response: Response = await fetchMovies(currentPage, searchQuery)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Movies</h1>

      <SearchForm searchQuery={searchQuery} />

      <MoviesGrid movies={response.movies} searchQuery={searchQuery} />

      <Pagination
        currentPage={currentPage}
        searchQuery={searchQuery}
        hasNextPage={response.movies.length > 0}
      />
    </div>
  )
}

function SearchForm({ searchQuery }: { searchQuery: string }) {
  return (
    <form method="GET" className="mb-6 flex space-x-2">
      <input
        type="text"
        name="search"
        placeholder="Search movies..."
        defaultValue={searchQuery}
        className="w-full px-4 py-2 border border-gray-300 rounded text-black"
      />
      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Search
      </button>
    </form>
  )
}

function MoviesGrid({ movies, searchQuery }: { movies: Movie[]; searchQuery: string }) {
  if (movies.length === 0) {
    return <p>No movies found</p>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {movies.map((movie) => (
        <MovieCard key={movie.uid} movie={movie} searchQuery={searchQuery} />
      ))}
    </div>
  )
}

function MovieCard({ movie, searchQuery }: { movie: Movie; searchQuery: string }) {
  return (
    <Link
      href={{
        pathname: `/${movie.uid}`,
        query: { search: searchQuery },
      }}
      passHref
      className="p-4 w-full rounded bg-white/10 mb-4 shadow-md border border-white/20 hover:border-blue-500"
    >
      <h2 className="text-xl font-bold">{movie["name@en"]}</h2>
      <div className="text-sm">
        {movie.initial_release_date ? new Date(movie.initial_release_date).getFullYear() : "N/A"}
      </div>
      <p>Genre: {movie.genre?.map((g) => g["name@en"]).join(", ") || "No genres listed"}</p>
      <p>Starring: {getStarringActors(movie.starring) || "No actors listed"}</p>
    </Link>
  )
}

function getStarringActors(starring?: Movie["starring"]): string | null {
  if (!starring) return null

  const actors = starring
    .flatMap((s) => s["performance.actor"]?.map((actor) => actor["name@en"]))
    .filter(Boolean)

  return actors.length > 0 ? actors.slice(0, 5).join(", ") : null
}

function Pagination({
  currentPage,
  searchQuery,
  hasNextPage,
}: {
  currentPage: number
  searchQuery: string
  hasNextPage: boolean
}) {
  return (
    <div className="flex justify-center items-center gap-4 mt-6">
      {currentPage > 1 && (
        <a
          href={`?page=${currentPage - 1}&search=${encodeURIComponent(searchQuery)}`}
          className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-400"
        >
          Previous
        </a>
      )}

      <span className="px-4 py-2 bg-white/10 text-white rounded">Page {currentPage}</span>

      {hasNextPage && (
        <a
          href={`?page=${currentPage + 1}&search=${encodeURIComponent(searchQuery)}`}
          className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-400"
        >
          Next
        </a>
      )}
    </div>
  )
}
