/*
 * A wrapper around the fetch API that adds the necessary url, credentials and headers
 * @param url - The URL to fetch
 * @param options - The options to pass to the fetch API
 * @returns The response from the API
 */
export async function fetcher(url: string, options?: RequestInit) {
  const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/v1`;
  return fetch(`${baseUrl}${url}`, {
    ...options,
    credentials: "include",
  });
}
