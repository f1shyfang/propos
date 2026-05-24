export class FetchError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof body === 'object' && body && 'error' in body
      ? String((body as { error: unknown }).error)
      : res.statusText || 'Request failed';
    throw new FetchError(message, res.status, body);
  }
  return body as T;
}
