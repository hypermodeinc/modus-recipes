import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Movie {
  id: string
  title: string
  poster: string
  genres: string[]
  actors: string[]
  plot: string
}

interface MovieCardProps {
  movie: Movie
}

export function MovieCard({ movie }: MovieCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-[400px]">
        <Image
          src={movie.poster || "https://via.placeholder.com/300x450"}
          alt={movie.title}
          layout="fill"
          objectFit="cover"
        />
      </div>
      <CardHeader>
        <CardTitle>{movie.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-2">
          {movie.genres.map((genre) => (
            <Badge key={genre} variant="secondary">
              {genre}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-gray-500 mb-2">
          {/* <strong>Actors:</strong> {movie.actors.join(", ")} */}
        </p>
        <p className="text-sm">{movie.plot}</p>
      </CardContent>
    </Card>
  )
}
