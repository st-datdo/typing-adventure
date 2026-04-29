export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: { total: number; page: number; limit: number }
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(endpoint, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    })
    const json = await res.json()
    return json as ApiResponse<T>
  } catch {
    return { success: false, error: 'Network error' }
  }
}
