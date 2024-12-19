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
      fetchMoviesWithPaginationAndSearch(page: $page, search: $search)
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
    const parsedData = JSON.parse(data.fetchMoviesWithPaginationAndSearch);
    return { movies: parsedData.data.movies || [] };
  } catch (err) {
    console.error("Error parsing response:", err);
    return { movies: [] };
  }
}

export async function fetchMovieDetailsAndRecommendations(
  uid: string,
  searchQuery: string = ""
) {
  const graphqlQuery = `
      query FetchMovieDetailsAndRecommendations($uid: String!, $searchQuery: String!) {
        fetchMovieDetailsAndRecommendations(uid: $uid, searchQuery: $searchQuery)
      }
    `;

  const { data, error } = await fetchQuery({
    query: graphqlQuery,
    variables: { uid, searchQuery },
  });

  if (error) {
    console.error("Error fetching movie details and recommendations:", error);
    return { movieDetails: null, recommendations: [] };
  }

  try {
    const parsedData = JSON.parse(data.fetchMovieDetailsAndRecommendations);
    return {
      movieDetails: parsedData.movieDetails || {},
      recommendations: parsedData.recommendations || [],
    };
  } catch (err) {
    console.error("Error parsing response:", err);
    return { movieDetails: null, recommendations: [] };
  }
}
