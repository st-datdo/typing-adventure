import { apiClient, type ApiResponse } from './client'

export interface WordPackSummary {
  id: string
  name: string
  level: string
  category: string | null
  isDefault: boolean
  wordCount: number
  words: string[]
}

export async function getWordPacks(level?: string): Promise<ApiResponse<WordPackSummary[]>> {
  const params = new URLSearchParams({ limit: '100' })
  if (level) params.set('level', level)
  return apiClient<WordPackSummary[]>(`/api/wordpacks?${params}`)
}
