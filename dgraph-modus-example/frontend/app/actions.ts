"use server";

type FetchQueryProps = {
  query: string;
  variables?: any;
};

const fetchQuery = async ({ query, variables }: FetchQueryProps) => {
  try {
    const res = await fetch(process.env.HYPERMODE_API_ENDPOINT as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });

    if (!res.ok) throw new Error(res.statusText);

    const { data, errors } = await res.json();
    if (errors) throw new Error(JSON.stringify(errors));

    return { data };
  } catch (err) {
    console.error("Error in fetchQuery:", err);
    return { data: null, error: err };
  }
};

export async function fetchMovies(page: number = 1, search: string = "") {
  const graphqlQuery = `
    query FetchMovies($page: Int!, $search: String!) {
      fetchMoviesAndActorsWithPagination(page: $page, search: $search)
    }
  `;

  const { data, error } = await fetchQuery({
    query: graphqlQuery,
    variables: { page, search },
  });

  if (error) {
    console.error("Error fetching movies:", error);
    return { movies: [] };
  }

  try {
    const parsedData = JSON.parse(data.fetchMoviesAndActorsWithPagination);
    return { movies: parsedData.data.movies || [] };
  } catch (err) {
    console.error("Error parsing response:", err);
    return { movies: [] };
  }
}

export async function fetchMovieById(uid: string) {
  const graphqlQuery = `
   query FetchMovieById($uid: String!) {
      fetchMovieById(uid: $uid)
    }
  `;

  const { data, error } = await fetchQuery({
    query: graphqlQuery,
    variables: { uid },
  });

  if (error) {
    console.error("Error fetching movie details:", error);
    return { movie: null };
  }
  try {
    const parsedData = JSON.parse(data.fetchMovieById);
    return { movie: parsedData.data.movie[0] || {} };
  } catch (err) {
    console.error("Error parsing response:", err);
    return { movie: {} };
  }
}
