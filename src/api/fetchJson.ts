/**
 * Fetch helper that validates HTTP status and parses JSON safely.
 * Avoids uncaught "JSON.parse: unexpected character" when the server returns HTML.
 */
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} for ${url}: ${text.slice(0, 200)}`
    );
  }

  if (!text.trim()) {
    throw new Error(`Empty response from ${url}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Invalid JSON from ${url}: ${text.slice(0, 200)}`
    );
  }
}
