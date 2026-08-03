const BASE = process.env.NEXT_PUBLIC_API_URL
  ?? 'https://dominicantour.leymaken.com/api'

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`API ${res.status}: ${error}`)
  }

  return res.json()
}
