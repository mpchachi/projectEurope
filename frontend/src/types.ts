export interface Cefr {
  level: string
  confidence: string
  reasoning: string
}

export interface TalkRatio {
  student_pct: number
  tutor_pct: number
  student_words: number
  tutor_words: number
  status: string
}

export interface NewWords {
  new_count: number
  total_vocab: number
  sample: string[]
  signal: string
}

export interface TopError {
  error: string
  correction: string
  type: string
  explanation: string
}

export interface Agency {
  score: number
  pct: number
  initiations: number
  responses: number
  intents: string[]
  status: string
}

export interface ActiveRecall {
  count: number
  words: string[]
  is_first_session: boolean
}

export interface SelfRepairs {
  count: number
  examples: string[]
  verdict: string
}

export interface FillerPressure {
  total: number
  by_topic: Record<string, number>
  worst_topic: string
}

export interface CodeSwitching {
  count: number
  instances: string[]
}

export interface GrayZone {
  structure: string
  expected_because: string
  evidence: string
}

export interface GrayZones {
  avoided: GrayZone[]
  verdict: string
}

export interface SentimentPoint {
  s: 'positive' | 'neutral' | 'negative'
  t?: number
}

export interface SentimentArc {
  data: SentimentPoint[]
  positive_pct: number
  neutral_pct: number
  negative_pct: number
  arc_direction: string
  available: boolean
}

export interface TopicExpansion {
  new_topics: string[]
  recurring_topics: string[]
  all_topics: string[]
}

export interface Session {
  label: string
  cefr: Cefr
  talk_ratio: TalkRatio
  new_words: NewWords
  top_errors: TopError[]
  session_summary: string
  agency: Agency
  active_recall: ActiveRecall
  self_repairs: SelfRepairs
  filler_pressure: FillerPressure
  code_switching: CodeSwitching
  gray_zones: GrayZones
  sentiment_arc: SentimentArc
  topic_expansion: TopicExpansion
}

export interface ProgressionSignal {
  name: string
  positive: boolean
}

export interface Progression {
  labels: string[]
  metrics_table: {
    talk_time_pct: number[]
    new_words: number[]
    total_vocab: number[]
    fillers: number[]
    agency_score: number[]
    active_recall: number[]
    cefr: string[]
  }
  signals: ProgressionSignal[]
  positive_count: number
  total_signals: number
  verdict: string
  cefr_journey: string[]
}

export interface AnalysisResult {
  sessions: Session[]
  progression: Progression | null
  preset?: {
    id: string
    name: string
    story: string
    badge: string
  }
}

export interface ConversationCard {
  id: string
  name: string
  description: string
  sessions: number
  story: string
  badge: string
}
