
@json
/**
 * A Movie
 */
export class Movie {
  id!: string
  title!: string
  plot!: string
  rating!: f32
  embedding: f32[] = []
  actors: string[] = []
  genres: string[] = []
  poster: string = ""

  constructor(id: string, title: string, plot: string, rating: f32) {
    this.id = id
    this.title = title
    this.plot = plot
    this.rating = rating
    this.embedding = []
  }
}


@json
/**
 * Results of a movie search, includes movie details and a similarity score
 */
export class MovieResult {
  movie!: Movie
  score: f32 = 0.0

  constructor(movie: Movie, score: f32) {
    this.movie = movie
    this.score = score
  }
}
