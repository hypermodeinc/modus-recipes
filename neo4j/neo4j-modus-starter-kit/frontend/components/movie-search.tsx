"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@apollo/client"
import { gql } from "@apollo/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MovieCard } from "@/components/movie-card"
import { Loader2 } from "lucide-react"

// GraphQL mutation to generate embeddings and save in Neo4j
const EMBEDDINGS_MUTATION = gql`
  mutation ($count: Int!) {
    saveEmbeddingsToNeo4j(count: $count)
  }
`
// GraphQL query to search for similar movies, given a movie title
const SEARCH_MOVIES = gql`
  query SearchMovies($query: String!) {
    findSimilarMovies(title: $query, num: 20) {
      movie {
        id
        title
        plot
        rating
        genres
        actors
        poster
      }
      score
    }
  }
`

export function MovieSearch() {
  const [query, setQuery] = useState("")
  const [mutationResult, setMutationResult] = useState<string | null>(null)

  const { loading, error, data, refetch } = useQuery(SEARCH_MOVIES, {
    variables: { query },
    skip: !query,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    refetch()
  }

  const [executeQuery, { loading: mutationLoading, error: mutationError }] = useMutation(
    EMBEDDINGS_MUTATION,
    {
      variables: { count: 200 },
      onCompleted: (data) => {
        setMutationResult(JSON.stringify(data, null, 2))
      },
    },
  )

  const handleClick = () => {
    executeQuery()
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for movies..."
          className="flex-grow"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
        <div className="flex flex-col items-center gap-4">
          <Button onClick={handleClick} disabled={loading}>
            {mutationLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mutationLoading ? "Generating Embeddings..." : "Generate Embeddings"}
          </Button>
          {mutationError && <p className="text-red-500">Error: {mutationError.message}</p>}
          {mutationResult && (
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-w-md">
              {mutationResult}
            </pre>
          )}
        </div>
      </form>
      {error && <p className="text-red-500 mb-4">Error: {error.message}</p>}
      <h2 className="text-3xl font-bold mb-8">Movie Recommendations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.findSimilarMovies.map((movie: any) => (
          <MovieCard
            key={movie.movie.id}
            movie={{
              ...movie.movie,
            }}
          />
        ))}
      </div>
    </div>
  )
}
