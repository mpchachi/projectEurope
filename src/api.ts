import type { AnalysisResult, ConversationCard } from './types'

const BASE = '/api'

export async function fetchConversations(): Promise<ConversationCard[]> {
  const r = await fetch(`${BASE}/conversations`)
  if (!r.ok) throw new Error('Failed to fetch conversations')
  return r.json()
}

export async function fetchPreset(id: string): Promise<AnalysisResult> {
  const r = await fetch(`${BASE}/analyze/preset/${id}`)
  if (!r.ok) throw new Error(`Failed to analyze preset ${id}`)
  return r.json()
}
