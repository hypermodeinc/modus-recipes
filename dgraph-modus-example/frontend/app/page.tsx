import { fetchMovies } from "./actions";

export default async function Home() {
  const response = await fetchMovies(1, ""); // Fetch page 1 with no search term

  return (
    <div>
      <h1>Movies</h1>
      {response.movies.length === 0 ? (
        <p>No movies found</p>
      ) : (
        response.movies.map((movie: any) => (
          <div key={movie.uid} style={{ marginBottom: "1rem" }}>
            <h2>{movie["name@en"]}</h2>
            <p>Release Date: {movie.initial_release_date}</p>
            <p>
              Starring:{" "}
              {movie.starring?.map((actor: any) => actor.name).join(", ") ||
                "No actors listed"}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
