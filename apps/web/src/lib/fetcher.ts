import cookiejs from "js-cookie";
/*
 * A wrapper around the fetch API that adds the necessary url, credentials and headers
 * @param url - The URL to fetch
 * @param options - The options to pass to the fetch API
 * @returns The response from the API
 */
export async function fetcher(url: string, options?: RequestInit) {
  const token = cookiejs.get("token");
  return fetch(`/api${url}`, {
    ...options,
    headers: {
      ...options?.headers,
      authorization: token ? `Bearer ${token}` : "",
    },
    // credentials: "include",
  });
}
