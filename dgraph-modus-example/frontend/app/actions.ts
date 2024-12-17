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
        // Authorization: `Bearer ${process.env.HYPERMODE_API_TOKEN}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(res.statusText);
    }

    const { data, errors } = await res.json();
    if (errors) throw new Error(JSON.stringify(errors));

    return { data };
  } catch (err) {
    console.error("Error in fetchQuery:", err);
    return { data: null, error: err };
  }
};

export async function fetchMovies(page: number = 0, search: string = "") {
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

  // Parse the JSON string returned from Modus
  try {
    const parsedData = JSON.parse(data.fetchMoviesAndActorsWithPagination);
    return { movies: parsedData.data.movies || [] };
  } catch (err) {
    console.error("Error parsing response:", err);
    return { movies: [] };
  }
}
