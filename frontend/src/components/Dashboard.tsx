import { useState, useEffect, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AnalysisResult, Session } from '../types'
import { EncryptedText } from './ui/EncryptedText'
import { CountUp } from './ui/CountUp'
import { MetricTooltip } from './ui/MetricTooltip'
import { RevealRow } from './ui/RevealRow'

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[Dashboard]', error, info.componentStack) }
  render() {
    if (this.state.error) return (
      <div className="card-premium" style={{ maxWidth: 480, margin: '48px auto' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#EF4444', marginBottom: 8 }}>Render error</p>
        <pre style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{this.state.error.message}</pre>
        <button onClick={() => this.setState({ error: null })} style={{ marginTop: 16, fontSize: 12, color: '#374151', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          Try again
        </button>
      </div>
    )
    return this.props.children
  }
}

import CEFRProgressCard from './CEFRProgressCard'
import Timeline         from './Timeline'
import NewWordsHero   from './NewWordsHero'
import WordsStuck     from './WordsStuck'
import SessionArtifacts from './SessionArtifacts'
import TalkRatio      from './metrics/TalkRatio'
import TopErrors      from './metrics/TopErrors'
import AgencyGauge    from './metrics/AgencyGauge'
import SentimentArc   from './metrics/SentimentArc'
import GrayZones, { DEFAULT_ZONES as GRAY_ZONES_TEMPLATE, type GrammarZone } from './metrics/GrayZones'
import FillerPressure from './metrics/FillerPressure'
import TopicExpansion from './metrics/TopicExpansion'
import SelfRepairs    from './metrics/SelfRepairs'
import ActiveRecall   from './metrics/ActiveRecall'


const BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  PROGRESSION: { bg: 'rgba(5,150,105,0.08)',  color: '#059669' },
  PLATEAU:     { bg: 'rgba(251,191,36,0.10)', color: '#B45309' },
  'CEFR DEMO': { bg: 'rgba(99,102,241,0.08)', color: '#4F46E5' },
  LIVE:        { bg: 'rgba(55,65,81,0.08)',   color: '#374151' },
}

// ─── Tokens ───────────────────────────────────────────────────────────────────

const T = {
  ink:    '#111111',
  gray:   '#6B7280',
  muted:  '#9CA3AF',
  border: '#EBEBEB',
  accent: '#FF4D7E',
  sectionLabel: {
    fontSize: 10, fontWeight: 700, color: '#BCBCBC',
    textTransform: 'uppercase', letterSpacing: '0.11em',
  } as React.CSSProperties,
  metricLabel: {
    fontSize: 10, fontWeight: 700, color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: '0.09em',
    marginBottom: 18,
  } as React.CSSProperties,
}

// ─── CompareConfig type ───────────────────────────────────────────────────────

type CompareConfig = {
  title: string
  subtitle: string
  values: number[]
  labels: string[]
  unit: string
  upIsGood: boolean
  formatVal?: (v: number) => string
}

// ─── TrendSparkline ───────────────────────────────────────────────────────────

function TrendSparkline({
  values, activeIdx, upIsGood = true, width = 80, height = 26,
}: {
  values: number[]; activeIdx: number; upIsGood?: boolean;
  width?: number; height?: number;
}) {
  if (!values || values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pad = 4
  const pts = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * (width - pad * 2),
    y: (height - pad) - ((v - min) / range) * (height - pad * 2),
  }))
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const isGood = upIsGood
    ? values[values.length - 1] >= values[0]
    : values[values.length - 1] <= values[0]
  const color = isGood ? '#34D399' : '#FCA5A5'
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${pts[0].x},${height} ${polyline} ${pts[pts.length - 1].x},${height}`}
        fill="url(#sg)" />
      <polyline points={polyline} fill="none" stroke={color}
        strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.7} />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y}
          r={i === activeIdx ? 3.5 : 2}
          fill={i === activeIdx ? color : '#FFFFFF'}
          stroke={color}
          strokeWidth={i === activeIdx ? 1.5 : 1}
          opacity={i === activeIdx ? 1 : 0.55} />
      ))}
    </svg>
  )
}

// ─── LineChart ────────────────────────────────────────────────────────────────

function LineChart({ values, labels, activeIdx, upIsGood = true, unit = '', formatVal }: {
  values: number[]; labels: string[]; activeIdx?: number;
  upIsGood?: boolean; unit?: string; formatVal?: (v: number) => string;
}) {
  const W = 432, H = 196
  const PL = 44, PT = 20, PR = 16, PB = 40
  const pw = W - PL - PR, ph = H - PT - PB
  const n = values.length
  if (n < 1) return null

  const rawMin = Math.min(...values), rawMax = Math.max(...values)
  const span = rawMax - rawMin || 1
  const yMin = rawMin - span * 0.12, yMax = rawMax + span * 0.18
  const xOf = (i: number) => PL + (n === 1 ? pw / 2 : (i / (n - 1)) * pw)
  const yOf = (v: number) => PT + (1 - (v - yMin) / (yMax - yMin)) * ph

  const pts = values.map((v, i) => ({ x: xOf(i), y: yOf(v), v }))
  const polyStr = pts.map(p => `${p.x},${p.y}`).join(' ')
  const areaPath = `M${pts[0].x},${PT + ph} L${pts.map(p => `${p.x},${p.y}`).join(' L')} L${pts[pts.length - 1].x},${PT + ph} Z`
  const isGood = upIsGood
    ? values[values.length - 1] >= values[0]
    : values[values.length - 1] <= values[0]
  const color = isGood ? '#34D399' : '#F87171'
  const fmt = formatVal ?? ((v: number) => Number.isInteger(v) ? String(v) : v.toFixed(1))
  const ticks = [0, 1, 2, 3].map(i => yMin + (yMax - yMin) * (i / 3))

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="lc-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.16" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => {
        const y = yOf(t)
        return (
          <g key={i}>
            <line x1={PL} y1={y} x2={W - PR} y2={y}
              stroke="#F0F0F0" strokeWidth={1} strokeDasharray="4 3" />
            <text x={PL - 6} y={y + 3.5} textAnchor="end" fontSize={9} fill="#C4C4CC">
              {fmt(t)}{unit === '%' ? '%' : ''}
            </text>
          </g>
        )
      })}
      <line x1={PL} y1={PT + ph} x2={W - PR} y2={PT + ph} stroke="#EAEAEA" strokeWidth={1} />
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={PT + ph + 14} textAnchor="middle" fontSize={9} fill="#C4C4CC">
          {(labels[i] ?? `S${i + 1}`).replace('Session ', 'S')}
        </text>
      ))}
      <path d={areaPath} fill="url(#lc-area)" />
      <polyline points={polyStr} fill="none" stroke={color}
        strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => {
        const isActive = i === activeIdx
        const label = `${fmt(p.v)}${unit === '%' ? '%' : unit.startsWith('/') ? unit : ''}`
        return (
          <g key={i}>
            {isActive && <circle cx={p.x} cy={p.y} r={11} fill="#FE79AB" opacity={0.10} />}
            <circle cx={p.x} cy={p.y} r={isActive ? 5 : 3.5}
              fill={isActive ? '#FE79AB' : '#FFFFFF'}
              stroke={isActive ? '#FE79AB' : color}
              strokeWidth={isActive ? 2 : 1.5} />
            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize={9.5}
              fontWeight={isActive ? '700' : '500'}
              fill={isActive ? '#FE79AB' : '#6B7280'}>
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── CompareModal ─────────────────────────────────────────────────────────────

function CompareModal({ config, activeIdx, onClose }: {
  config: CompareConfig; activeIdx: number; onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const n = config.values.length
  const delta = n >= 2 ? config.values[n - 1] - config.values[0] : 0
  const isImproving = config.upIsGood ? delta >= 0 : delta <= 0
  const fmt = config.formatVal ?? ((v: number) => v.toFixed(1))
  const fmtDelta = `${delta >= 0 ? '+' : '−'}${fmt(Math.abs(delta))}${config.unit === '%' ? '%' : ' ' + config.unit.trim()}`

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(18,17,20,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF', borderRadius: 16,
          padding: '24px 24px 20px', width: '100%', maxWidth: 520,
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#121114', margin: 0 }}>
              {config.title}
            </h2>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{config.subtitle}</p>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 20, color: '#C4C4CC', lineHeight: 1, padding: 4 }}>
            ×
          </button>
        </div>

        <LineChart
          values={config.values} labels={config.labels} activeIdx={activeIdx}
          upIsGood={config.upIsGood} unit={config.unit} formatVal={config.formatVal} />

        {n >= 2 && (
          <div style={{
            marginTop: 14, padding: '9px 14px', borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 10,
            background: isImproving ? 'rgba(52,211,153,0.07)' : 'rgba(248,113,113,0.07)',
            border: `1px solid ${isImproving ? 'rgba(52,211,153,0.22)' : 'rgba(248,113,113,0.22)'}`,
          }}>
            <span style={{ fontSize: 16 }}>{isImproving ? '↗' : '↘'}</span>
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0,
              color: isImproving ? '#059669' : '#DC2626' }}>
              {fmtDelta} from {config.labels[0]} to {config.labels[n - 1]}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CardHeader ───────────────────────────────────────────────────────────────

function CardHeader({ label, trend, activeIdx, upIsGood = true, onCompare }: {
  label: string
  trend?: number[]
  activeIdx?: number
  upIsGood?: boolean
  onCompare?: () => void
}) {
  const showExtras = onCompare && trend && trend.length >= 2 && activeIdx !== undefined
  if (!showExtras) {
    return <div style={T.metricLabel}>{label}</div>
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <TrendSparkline values={trend} activeIdx={activeIdx} upIsGood={upIsGood} />
        <button
          onClick={onCompare}
          style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
            color: '#C4C4CC', background: 'none', border: 'none',
            cursor: 'pointer', padding: '2px 0', lineHeight: 1, flexShrink: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#FE79AB')}
          onMouseLeave={e => (e.currentTarget.style.color = '#C4C4CC')}
        >
          COMPARE ↗
        </button>
      </div>
    </div>
  )
}

// ─── PremiumCard ──────────────────────────────────────────────────────────────

function PremiumCard({ children, style, why }: { children: React.ReactNode; style?: React.CSSProperties; why?: string }) {
  return (
    <motion.div
      className="card-premium"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={style}
      data-why={why}
    >
      {children}
    </motion.div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ ...T.sectionLabel, marginBottom: 12 }}>{label}</div>
      {children}
    </div>
  )
}

// ─── Section 1: Overview ──────────────────────────────────────────────────────

function OverviewSection({ session, progression }: {
  session: Session
  progression: NonNullable<AnalysisResult['progression']> | null
}) {
  const positive  = (progression?.signals ?? []).filter(s => s.positive).map(s => s.name)
  const negative  = (progression?.signals ?? []).filter(s => !s.positive).map(s => s.name)
  const good      = progression?.positive_count ?? 0
  const tot       = Math.max(progression?.total_signals ?? 1, 1)
  const ratio     = good / tot
  const status    = ratio >= 0.6 ? 'progressing' : ratio >= 0.4 ? 'plateauing' : 'declining'
  const conf      = session.cefr?.confidence ?? ''
  const safeConf  = (['high', 'medium', 'low'] as const).find(c => c === conf) ?? 'medium'

  return (
    <Section label="Session Overview">
      <PremiumCard>
        <CEFRProgressCard
          level={session.cefr?.level}
          confidence={safeConf}
          description={session.cefr?.reasoning}
          positiveSignals={positive}
          negativeSignals={negative}
          sessionSummary={session.session_summary}
          progressionStatus={status}
          nextFocus={negative[0]}
          signalsScore={progression?.positive_count ?? 0}
          signalsTotal={progression?.total_signals ?? 0}
        />
      </PremiumCard>
    </Section>
  )
}

// ─── Section 2: Communication ─────────────────────────────────────────────────

function CommunicationSection({ session, progression, activeSession, onCompareTalkRatio, onCompareAgency }: {
  session: Session
  progression: NonNullable<AnalysisResult['progression']> | null
  activeSession: number
  onCompareTalkRatio?: () => void
  onCompareAgency?: () => void
}) {
  const mt = progression?.metrics_table
  return (
    <Section label="Communication">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        <PremiumCard why="Output hypothesis (Swain, 1985): comprehensible output — not just input — is what drives real acquisition. Speaking time is the most honest proxy for that.">
          <CardHeader label="Talk Ratio" trend={mt?.talk_time_pct} activeIdx={activeSession} upIsGood={true} onCompare={onCompareTalkRatio} />
          {session.talk_ratio ? (
            <TalkRatio
              studentPercent={Math.round(session.talk_ratio.student_pct)}
              tutorPercent={Math.round(session.talk_ratio.tutor_pct)}
            />
          ) : <p style={{ fontSize: 13, color: T.muted }}>No data</p>}
        </PremiumCard>

        <PremiumCard why="Conversational initiative predicts long-term retention better than accuracy scores (Lantolf, 2000). A student who leads the conversation owns the language.">
          <CardHeader label="Conversational Agency" trend={mt?.agency_score} activeIdx={activeSession} upIsGood={true} onCompare={onCompareAgency} />
          {session.agency
            ? <AgencyGauge data={session.agency} />
            : <p style={{ fontSize: 13, color: T.muted }}>No data</p>}
        </PremiumCard>

      </div>
    </Section>
  )
}

// ─── Sentiment adapter: SentimentArcType → new organic terrain props ─────────

function adaptSentimentData(arc: Session['sentiment_arc']): {
  data?: { minute: number; confidence: number }[]
  peakMinute?: number; peakLabel?: string
  dipMinute?: number;  dipLabel?: string
  totalMinutes?: number
} {
  if (!arc?.available || !arc.data.length) return {}

  const pts = arc.data.map((p, i) => ({
    minute: parseFloat(((p.t ?? i * 2) / 60).toFixed(1)),
    confidence: p.s === 'positive' ? 0.78 : p.s === 'neutral' ? 0.50 : 0.22,
  }))

  let peakIdx = 0, dipIdx = 0
  pts.forEach((p, i) => {
    if (p.confidence > pts[peakIdx].confidence) peakIdx = i
    if (p.confidence < pts[dipIdx].confidence)  dipIdx  = i
  })

  const totalMinutes = Math.max(...pts.map(p => p.minute)) || 1
  const dir = arc.arc_direction
  const peakLabel = dir === 'warming' ? 'Confidence building'
    : dir === 'consistent' ? 'Sustained focus'
    : 'Pressure easing off'

  return {
    data: pts,
    peakMinute: pts[peakIdx].minute,
    peakLabel,
    dipMinute:  pts[dipIdx].minute,
    dipLabel:   'Cognitive load',
    totalMinutes,
  }
}

// ─── Gray Zones adapter: overlay real avoided data onto the full template ─────
//
// Strategy: start from DEFAULT_ZONES (12-zone B1 taxonomy with owned/emerging/
// avoided defaults), then mark any structure the LLM flagged as "avoided" with
// its real sessionsAvoided count. Unknown avoided structures are appended.
// This ensures ownedCount is always meaningful, not always 0.

function adaptGrayZones(gz: Session['gray_zones']): GrammarZone[] | undefined {
  if (!gz?.avoided?.length) return undefined   // pure defaults — let component handle it

  const realAvoided = gz.avoided                // { structure, expected_because, evidence }[]

  // Build a lookup: normalized name → index in template
  const templateMap = new Map(
    GRAY_ZONES_TEMPLATE.map((z, i) => [z.name.toLowerCase(), i])
  )

  // Clone template so we can mutate
  const result: GrammarZone[] = GRAY_ZONES_TEMPLATE.map(z => ({ ...z }))
  const seen = new Set<number>()

  realAvoided.forEach(({ structure }) => {
    const key = structure.toLowerCase()
    const idx = templateMap.get(key)
    if (idx !== undefined) {
      result[idx] = { name: result[idx].name, status: 'avoided' }
      seen.add(idx)
    } else {
      // Structure not in template — append it
      result.push({ name: structure, status: 'avoided' })
    }
  })

  return result
}

// ─── Topic Expansion adapter: TopicExpansionType → network props ─────────────

type TopicNode = { id: string; label: string; type: 'known' | 'bridge' | 'expanded'; strength: number }
type TopicConn = { from: string; to: string; weight: number }

function adaptTopicExpansion(te: Session['topic_expansion'], session: Session): {
  nodes?: TopicNode[]; connections?: TopicConn[]
  expansionScore?: number; newTopicsCount?: number
  dominantDomain?: string; sessionLabel?: string
} {
  const recurring = (te?.recurring_topics ?? []).slice(0, 3)
  const newTopics = (te?.new_topics ?? []).slice(0, 6)
  if (!recurring.length && !newTopics.length) return {}

  const IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
  const nodes: TopicNode[] = []

  recurring.forEach((label, i) =>
    nodes.push({ id: IDS[i], label, type: 'known', strength: 0.88 - i * 0.04 }))

  const bridgeCount = Math.min(2, Math.ceil(newTopics.length / 3))
  newTopics.slice(0, bridgeCount).forEach((label, i) =>
    nodes.push({ id: IDS[recurring.length + i], label, type: 'bridge', strength: 0.68 - i * 0.06 }))

  newTopics.slice(bridgeCount).forEach((label, i) =>
    nodes.push({ id: IDS[recurring.length + bridgeCount + i], label, type: 'expanded', strength: 0.54 - i * 0.05 }))

  const knownIds    = nodes.filter(n => n.type === 'known').map(n => n.id)
  const bridgeIds   = nodes.filter(n => n.type === 'bridge').map(n => n.id)
  const expandedIds = nodes.filter(n => n.type === 'expanded').map(n => n.id)

  const connections: TopicConn[] = []
  knownIds.slice(0, 3).forEach((k, ki) =>
    bridgeIds.forEach((b, bi) => connections.push({ from: k, to: b, weight: 0.80 - ki * 0.05 - bi * 0.03 })))
  bridgeIds.forEach((b, i) =>
    expandedIds.slice(i * 2, i * 2 + 2).forEach((e, ei) =>
      connections.push({ from: b, to: e, weight: 0.62 - i * 0.06 - ei * 0.08 })))

  const total = recurring.length + newTopics.length
  return {
    nodes,
    connections,
    expansionScore:  total > 0 ? Math.round((newTopics.length / total) * 100) : 0,
    newTopicsCount:  te?.new_topics?.length ?? 0,
    dominantDomain:  newTopics[0] ?? 'Language acquisition',
    sessionLabel:    `${session.label} · ${session.cefr?.level ?? ''} trajectory`,
  }
}

// ─── Section 3: Session Patterns ─────────────────────────────────────────────

function PatternsSection({ session, progression, activeSession, onCompareFillers }: {
  session: Session
  progression: NonNullable<AnalysisResult['progression']> | null
  activeSession: number
  onCompareFillers?: () => void
}) {
  const mt = progression?.metrics_table
  return (
    <Section label="Session Patterns">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        <PremiumCard why="Self-repair correlates with metalinguistic awareness — the internal monitor catching errors before they fossilise. First described by Levelt (1983) as a key marker of implicit knowledge forming.">
          <div style={T.metricLabel}>Self-Repair Rate</div>
          <SelfRepairs data={session.self_repairs} />
        </PremiumCard>

        <PremiumCard why="Disfluencies don't distribute randomly — they cluster around domains where cognitive load exceeds automaticity. The topic with the most fillers is the student's exact next frontier.">
          <CardHeader label="Filler Pressure" trend={mt?.fillers} activeIdx={activeSession} upIsGood={false} onCompare={onCompareFillers} />
          <FillerPressure
            topics={Object.entries(session.filler_pressure?.by_topic ?? {}).map(([topic, fillers]) => ({ topic, fillers }))}
          />
        </PremiumCard>

        <PremiumCard why="Derived from Deepgram sentiment per utterance. Confidence isn't flat across a session — it peaks and dips with cognitive load. Knowing when the dip happened is more useful than knowing the average.">
          <div style={T.metricLabel}>Confidence Arc</div>
          {session.sentiment_arc?.available
            ? <SentimentArc {...adaptSentimentData(session.sentiment_arc)} />
            : <p style={{ fontSize: 13, color: T.muted }}>No sentiment data</p>}
        </PremiumCard>

      </div>
    </Section>
  )
}

// ─── Section 4: Vocabulary ────────────────────────────────────────────────────

function VocabularySection({ session, progression, activeSession, onCompareVocab, onCompareRecall }: {
  session: Session
  progression: NonNullable<AnalysisResult['progression']> | null
  activeSession: number
  onCompareVocab?: () => void
  onCompareRecall?: () => void
}) {
  const mt = progression?.metrics_table
  return (
    <Section label="Vocabulary">

      {/* Words that stuck — animated carousel of top vocab */}
      <WordsStuck session={session} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>

        <PremiumCard why="Measures productive vocabulary — words the student generates spontaneously, not just recognises. The distinction between receptive and productive lexicon is the most undertracked metric in language learning.">
          <CardHeader label="Total Vocabulary" trend={mt?.total_vocab} activeIdx={activeSession} upIsGood={true} onCompare={onCompareVocab} />
          <CountUp
            value={session.new_words?.total_vocab ?? 0}
            delay={300}
            style={{ display: 'block', fontSize: 72, fontWeight: 800, color: T.ink, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 8 }}
          />
          <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 12 }}>
            Cumulative words
          </div>
          <div style={{ fontSize: 13, color: T.gray }}>
            +<CountUp value={session.new_words?.new_count ?? 0} delay={350} /> new this session
          </div>
        </PremiumCard>

        <PremiumCard>
          <CardHeader label="Active Recall" trend={mt?.active_recall} activeIdx={activeSession} upIsGood={true} onCompare={onCompareRecall} />
          <ActiveRecall data={session.active_recall} />
        </PremiumCard>

      </div>

      <PremiumCard style={{ marginTop: 16 }} why="Vocabulary doesn't grow linearly — it expands in clusters, jumping from known anchors through bridge concepts into new frontier territory. This network maps that topology for each session.">
        <div style={T.metricLabel}>Topic Expansion</div>
        <TopicExpansion {...adaptTopicExpansion(session.topic_expansion, session)} />
      </PremiumCard>
    </Section>
  )
}

// ─── Section 5: Diagnostic ────────────────────────────────────────────────────

function DiagnosticSection({ session }: { session: Session }) {
  const switchCount = session.code_switching?.count ?? 0

  return (
    <Section label="Diagnostic">
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: 16 }}>

        <PremiumCard>
          <div style={T.metricLabel}>Top Errors</div>
          <TopErrors data={session.top_errors} />
        </PremiumCard>

        <PremiumCard why="Grammar structures the student systematically avoids — not because they don't know them, but because their brain hasn't automated them yet. The empty sectors are the real curriculum.">
          <div style={T.metricLabel}>Gray Zones</div>
          <GrayZones zones={adaptGrayZones(session.gray_zones)} />
        </PremiumCard>

        <PremiumCard>
          <div style={T.metricLabel}>Code-Switching</div>
          <div style={{ marginBottom: 16 }}>
            <CountUp
              value={switchCount}
              delay={200}
              style={{ display: 'block', fontSize: 72, fontWeight: 800, color: T.ink, lineHeight: 1, letterSpacing: '-0.04em' }}
            />
            <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.09em', marginTop: 7 }}>
              Language switches
            </div>
          </div>
          {switchCount === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#059669' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Stayed in English throughout
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {session.code_switching.instances.slice(0, 3).map((inst, i) => (
                <p key={i} style={{ fontSize: 12, color: T.gray, fontStyle: 'italic', lineHeight: 1.5, margin: 0, borderLeft: '2px solid #EBEBEB', paddingLeft: 10 }}>
                  "{typeof inst === 'string' ? inst : (inst as { txt: string }).txt}"
                </p>
              ))}
            </div>
          )}
        </PremiumCard>

      </div>
    </Section>
  )
}

// ─── Sticky Header ─────────────────────────────────────────────────────────────

function StickyHeader({ data, sessions, activeSession, setActiveSession, onBack }: {
  data: AnalysisResult
  sessions: Session[]
  activeSession: number
  setActiveSession: (i: number) => void
  onBack: () => void
}) {
  const [scrolled, setScrolled] = useState(false)
  const preset = data.preset
  const badgeStyle  = preset ? (BADGE_STYLE[preset.badge] ?? BADGE_STYLE.PROGRESSION) : null
  const cefrJourney = data.progression?.cefr_journey

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(245,245,246,0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #E5E5E5',
      boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.05)' : 'none',
      transition: 'box-shadow 0.2s',
      height: 48,
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px', height: '100%', display: 'flex', alignItems: 'center', gap: 14 }}>

        <button onClick={onBack}
          style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = T.ink)}
          onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>
          ← Back
        </button>

        {preset && (
          <>
            <div style={{ width: 1, height: 14, background: '#E5E5E5', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: T.ink, flexShrink: 0 }}>{preset.name}</span>
            {badgeStyle && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0, background: badgeStyle.bg, color: badgeStyle.color }}>
                {preset.badge}
              </span>
            )}
          </>
        )}

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {sessions.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setActiveSession(Math.max(0, activeSession - 1))}
                disabled={activeSession === 0}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  border: '1px solid #D9D9DE', background: 'none',
                  cursor: activeSession === 0 ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: activeSession === 0 ? '#D9D9DE' : '#6F6F78',
                  fontSize: 16, lineHeight: 1,
                }}
              >
                ‹
              </button>

              <div style={{ textAlign: 'center', minWidth: 120 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#121114' }}>
                  {sessions[activeSession]?.label}
                </span>
                <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 6 }}>
                  {activeSession + 1} / {sessions.length}
                </span>
              </div>

              <button
                onClick={() => setActiveSession(Math.min(sessions.length - 1, activeSession + 1))}
                disabled={activeSession === sessions.length - 1}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  border: '1px solid #D9D9DE', background: 'none',
                  cursor: activeSession === sessions.length - 1 ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: activeSession === sessions.length - 1 ? '#D9D9DE' : '#6F6F78',
                  fontSize: 16, lineHeight: 1,
                }}
              >
                ›
              </button>
            </div>
          )}
        </div>

        {cefrJourney && cefrJourney.length >= 2 && (
          <div style={{ fontSize: 11, fontWeight: 700, color: T.gray, flexShrink: 0 }}>
            {cefrJourney[0]} → {cefrJourney[cefrJourney.length - 1]}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Session View ──────────────────────────────────────────────────────────────

function SessionView({ session, progression, activeSession, onCompareTalkRatio, onCompareAgency, onCompareFillers, onCompareVocab, onCompareRecall }: {
  session: Session
  progression: NonNullable<AnalysisResult['progression']> | null
  activeSession: number
  onCompareTalkRatio?: () => void
  onCompareAgency?: () => void
  onCompareFillers?: () => void
  onCompareVocab?: () => void
  onCompareRecall?: () => void
}) {
  return (
    <div>
      <RevealRow delay={0}>
        <NewWordsHero session={session} />
      </RevealRow>
      <RevealRow delay={0.05}>
        <OverviewSection session={session} progression={progression} />
      </RevealRow>
      <RevealRow delay={0.1}>
        <SessionArtifacts session={session} />
      </RevealRow>
      <RevealRow delay={0.1}>
        <CommunicationSection session={session} progression={progression} activeSession={activeSession} onCompareTalkRatio={onCompareTalkRatio} onCompareAgency={onCompareAgency} />
      </RevealRow>
      <RevealRow delay={0.15}>
        <PatternsSection session={session} progression={progression} activeSession={activeSession} onCompareFillers={onCompareFillers} />
      </RevealRow>
      <RevealRow delay={0.2}>
        <VocabularySection session={session} progression={progression} activeSession={activeSession} onCompareVocab={onCompareVocab} onCompareRecall={onCompareRecall} />
      </RevealRow>
      <RevealRow delay={0.25}>
        <DiagnosticSection session={session} />
      </RevealRow>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function DashboardInner({ data, onBack }: { data: AnalysisResult; onBack: () => void }) {
  const [activeSession, setActiveSession] = useState(0)
  const [compareConfig, setCompareConfig] = useState<CompareConfig | null>(null)
  const sessions = data.sessions ?? []
  const mt     = data.progression?.metrics_table
  const labels = data.progression?.labels ?? []

  const onCompareTalkRatio = mt ? () => setCompareConfig({
    title: 'Talk Ratio',
    subtitle: 'Student speaking time across sessions (%)',
    values: mt.talk_time_pct, labels, unit: '%', upIsGood: true,
    formatVal: v => v.toFixed(1),
  }) : undefined

  const onCompareAgency = mt ? () => setCompareConfig({
    title: 'Conversational Agency',
    subtitle: 'Agency score across sessions (0–10)',
    values: mt.agency_score, labels, unit: '/10', upIsGood: true,
    formatVal: v => v.toFixed(1),
  }) : undefined

  const onCompareFillers = mt ? () => setCompareConfig({
    title: 'Filler Pressure',
    subtitle: 'Total filler words per session',
    values: mt.fillers, labels, unit: ' fillers', upIsGood: false,
    formatVal: v => String(Math.round(v)),
  }) : undefined

  const onCompareVocab = mt ? () => setCompareConfig({
    title: 'Total Vocabulary',
    subtitle: 'Cumulative unique words across sessions',
    values: mt.total_vocab, labels, unit: ' words', upIsGood: true,
    formatVal: v => String(Math.round(v)),
  }) : undefined

  const onCompareRecall = mt ? () => setCompareConfig({
    title: 'Active Recall',
    subtitle: 'Words from previous sessions that reappeared',
    values: mt.active_recall, labels, unit: ' words', upIsGood: true,
    formatVal: v => String(Math.round(v)),
  }) : undefined

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F6' }}>
      <MetricTooltip />
      <StickyHeader data={data} sessions={sessions} activeSession={activeSession} setActiveSession={setActiveSession} onBack={onBack} />

      <div style={{ textAlign: 'center', padding: '36px 32px 28px' }}>
        <EncryptedText
          text="Decoding session signals"
          startDelayMs={500}
          revealDelayMs={95}
          scrambleSpeed={38}
          style={{ fontSize: 44, fontWeight: 600, letterSpacing: '0.05em' }}
          encryptedStyle={{ color: '#9CA3AF' }}
          revealedStyle={{ color: '#1F2937' }}
        />
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px 80px' }}>
        {data.progression && sessions.length > 1 && (
          <Timeline
            progression={data.progression}
            activeSession={activeSession}
            onSelectSession={setActiveSession}
          />
        )}
        <AnimatePresence mode="wait">
          {sessions[activeSession] ? (
            <motion.div key={activeSession} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <SessionView
                session={sessions[activeSession]}
                progression={data.progression}
                activeSession={activeSession}
                onCompareTalkRatio={onCompareTalkRatio}
                onCompareAgency={onCompareAgency}
                onCompareFillers={onCompareFillers}
                onCompareVocab={onCompareVocab}
                onCompareRecall={onCompareRecall}
              />
            </motion.div>
          ) : (
            <p style={{ fontSize: 13, color: T.muted, padding: '48px 0' }}>No session data available.</p>
          )}
        </AnimatePresence>
      </div>
      {compareConfig && (
        <CompareModal
          config={compareConfig}
          activeIdx={activeSession}
          onClose={() => setCompareConfig(null)}
        />
      )}
    </div>
  )
}

export default function Dashboard({ data, onBack }: { data: AnalysisResult; onBack: () => void }) {
  return <ErrorBoundary><DashboardInner data={data} onBack={onBack} /></ErrorBoundary>
}
