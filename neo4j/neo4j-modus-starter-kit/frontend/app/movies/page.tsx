import { MovieSearch } from "@/components/movie-search"

export default function MoviesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Movie Search</h1>
      <MovieSearch />
    </div>
  )
}
