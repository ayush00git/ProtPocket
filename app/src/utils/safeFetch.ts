/**
 * Safely parse a Response body as JSON.
 * Returns `null` if the body is empty or not valid JSON,
 * instead of throwing "Unexpected end of JSON input".
 */
export async function safeJson<T = any>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text || text.trim().length === 0) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
