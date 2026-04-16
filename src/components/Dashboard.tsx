import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AnalysisResult, Session, SentimentArc as SentimentArcType } from '../types'
import TopErrors from './metrics/TopErrors'
import AgencyGauge from './metrics/AgencyGauge'
import GrayZones from './metrics/GrayZones'
import TopicExpansion from './metrics/TopicExpansion'
import ActiveRecall from './metrics/ActiveRecall'

// ─── Design tokens ──────────────────────────────────────────────────────────────

const PINK  = '#FF4785'
const INK   = '#0a0a0a'
const MUTED = '#555'
const LIGHT = '#888'

const CARD: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 20,
  padding: 32,
  boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
}

const PLAYFAIR: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontWeight: 900,
  color: PINK,
  lineHeight: 1,
  letterSpacing: '-0.02em',
}

const DM: React.CSSProperties = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
}

const SECTION_TAG: React.CSSProperties = {
  ...DM,
  display: 'block',
  fontSize: 10,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.4em',
  color: PINK,
  fontWeight: 500,
  marginBottom: 14,
}

// ─── Static maps ───────────────────────────────────────────────────────────────

const CEFR_COLOR: Record<string, string> = {
  A1: '#6F6F78', A2: '#3B82F6', B1: '#F59E0B',
  B2: '#F97316', C1: '#34D399', C2: '#8B5CF6',
}

const CEFR_RANK: Record<string, number> = {
  A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5,
}

// ─── Trend badge ───────────────────────────────────────────────────────────────

function TrendBadge({ prev, curr, type }: {
  prev?: string | number; curr?: string | number; type: 'cefr' | 'number'
}) {
  if (prev == null || curr == null) return <span style={{ color: '#ddd', fontSize: 12 }}>—</span>

  let dir: 'up' | 'down' | 'flat' = 'flat'
  if (type === 'cefr') {
    const rP = CEFR_RANK[prev as string] ?? -1
    const rC = CEFR_RANK[curr as string] ?? -1
    if (rC > rP) dir = 'up'
    else if (rC < rP) dir = 'down'
  } else {
    const diff = Number(curr) - Number(prev)
    if (diff > 0) dir = 'up'
    else if (diff < 0) dir = 'down'
  }

  const S = {
    up:   { bg: 'rgba(52,211,153,0.14)', color: '#059669', icon: '↑' },
    down: { bg: 'rgba(239,68,68,0.10)',  color: '#EF4444', icon: '↓' },
    flat: { bg: '#f0f0f0',               color: LIGHT,     icon: '—' },
  }
  const s = S[dir]

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 24, height: 24, borderRadius: '50%',
      background: s.bg, color: s.color,
      fontSize: 12, fontWeight: 700, ...DM,
    }}>
      {s.icon}
    </span>
  )
}

// ─── Sentiment SVG ─────────────────────────────────────────────────────────────

function SentimentSvg({ data }: { data: SentimentArcType }) {
  const W = 500, H = 90

  if (!data?.available || !data.data?.length) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }} preserveAspectRatio="none">
        <line x1="0" y1={H / 2} x2={W} y2={H / 2}
          stroke={PINK} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.3" />
      </svg>
    )
  }

  const pts = data.data.map(p => p.s === 'positive' ? 1 : p.s === 'negative' ? -1 : 0)
  const n = pts.length

  const coords = pts.map((v, i) => ({
    x: n <= 1 ? W / 2 : (i / (n - 1)) * W,
    y: H / 2 - v * (H * 0.38),
  }))

  let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)]
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const p3 = coords[Math.min(coords.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg-s" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={PINK} stopOpacity="0.25" />
          <stop offset="50%"  stopColor={PINK} stopOpacity="1" />
          <stop offset="100%" stopColor={PINK} stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id="sg-a" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor={PINK} stopOpacity="0.10" />
          <stop offset="100%" stopColor={PINK} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={d + ` L ${W} ${H} L 0 ${H} Z`} fill="url(#sg-a)" />
      <path d={d} fill="none" stroke="url(#sg-s)"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Page header ───────────────────────────────────────────────────────────────

function PageHeader({ data, sessions, activeSession, setActiveSession, onBack }: {
  data: AnalysisResult
  sessions: Session[]
  activeSession: number
  setActiveSession: (i: number) => void
  onBack: () => void
}) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  const session = sessions[activeSession]
  const signals  = data.progression?.signals.slice(0, 4) ?? []
  const journey  = data.progression?.cefr_journey
  const nextCefr = journey && journey.length >= 2
    ? journey[journey.length - 1] : null
  const isDifferent = nextCefr && nextCefr !== session.cefr?.level
  const oneLiner = (session.session_summary ?? '').split(/[.!?]/)[0]?.trim() ?? ''

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid #efefef',
      boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.06)' : 'none',
      transition: 'box-shadow 0.25s',
    }}>
      <div style={{ padding: '28px 48px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 40 }}>

        {/* Left: back · name · CEFR · summary */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <button onClick={onBack} style={{
              ...DM, color: LIGHT, fontSize: 13, display: 'flex', alignItems: 'center',
              gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            {data.preset && (
              <>
                <span style={{ color: '#ddd' }}>·</span>
                <span style={{ ...DM, color: LIGHT, fontSize: 13 }}>{data.preset.name}</span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 8 }}>
            <span style={{ ...PLAYFAIR, fontSize: 72, color: INK }}>
              {session.cefr?.level ?? '?'}
            </span>
            {isDifferent && (
              <span style={{ ...PLAYFAIR, fontSize: 48, color: PINK }}>
                → {nextCefr}
              </span>
            )}
          </div>

          {oneLiner && (
            <p style={{ ...DM, fontSize: 14, color: MUTED, fontWeight: 300, maxWidth: 480, lineHeight: 1.55 }}>
              {oneLiner}
            </p>
          )}
        </div>

        {/* Center: session tabs */}
        {sessions.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 6 }}>
            {sessions.map((s, i) => (
              <button key={i} onClick={() => setActiveSession(i)} style={{
                ...DM, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                background: activeSession === i ? PINK : '#f3f3f3',
                color: activeSession === i ? '#fff' : MUTED,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Right: signal pills + confidence */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 420, justifyContent: 'flex-end', paddingTop: 4 }}>
          {signals.map(s => (
            <span key={s.name} style={{
              ...DM,
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '5px 12px', borderRadius: 20,
              background: s.positive ? INK : '#fff0f3',
              color: s.positive ? '#fff' : PINK,
              fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
            }}>
              {s.name} {s.positive ? '↑' : '↓'}
            </span>
          ))}
          {session.cefr?.confidence && (
            <span style={{
              ...DM,
              padding: '5px 12px', borderRadius: 20,
              background: '#f5f5f5', color: LIGHT,
              fontSize: 12, fontWeight: 400,
            }}>
              {session.cefr.confidence} confidence
            </span>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Derive insights ───────────────────────────────────────────────────────────

function deriveInsights(session: Session) {
  type Ins = { positive: boolean; text: string; detail?: string }
  const all: Ins[] = []

  const sig = session.new_words?.signal
  if (sig === 'strong_growth') {
    all.push({ positive: true,  text: 'Vocabulary expanding strongly',        detail: `${session.new_words.new_count} new words` })
  } else if (sig === 'plateau') {
    all.push({ positive: false, text: 'Vocabulary not expanding this session', detail: `${session.new_words?.new_count} new words` })
  } else {
    all.push({ positive: true,  text: 'Normal vocabulary growth',             detail: `${session.new_words?.new_count} new words` })
  }

  const repairs = session.self_repairs?.count ?? 0
  if (repairs >= 3) {
    all.push({ positive: true,  text: 'Frequently corrects own mistakes', detail: `${repairs} self-corrections` })
  } else if (repairs === 0) {
    all.push({ positive: false, text: 'No self-corrections detected',     detail: 'May not be noticing errors' })
  }

  if (session.agency?.status === 'proactive') {
    all.push({ positive: true,  text: 'Drives the conversation independently', detail: `${session.agency.pct.toFixed(0)}% initiated` })
  } else if (session.agency?.status === 'reactive') {
    all.push({ positive: false, text: 'Mostly reactive — waits to be asked',   detail: `${session.agency?.pct.toFixed(0)}% initiated` })
  }

  const fillers = session.filler_pressure?.total ?? 0
  if (fillers > 10) {
    all.push({ positive: false, text: `High hesitation: ${session.filler_pressure?.worst_topic || 'multiple topics'}`, detail: `${fillers} fillers` })
  } else if (fillers <= 4) {
    all.push({ positive: true,  text: 'Speaks fluently with very low filler usage', detail: `${fillers} fillers` })
  }

  const sw = session.code_switching?.count ?? 0
  if (sw === 0)     all.push({ positive: true,  text: 'Stayed fully in English throughout' })
  else if (sw > 3)  all.push({ positive: false, text: `Switched languages ${sw} times` })

  return all
}

// ─── Key metrics grid ──────────────────────────────────────────────────────────

function KeyMetricsGrid({ session }: { session: Session }) {
  const talk   = session.talk_ratio
  const student = talk.student_pct
  const tutor   = talk.tutor_pct
  const silenceRaw = Math.max(0, 100 - student - tutor)
  const total  = student + tutor + silenceRaw

  const filler  = session.filler_pressure
  const fEntries = Object.entries(filler?.by_topic ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
  const fMax = Math.max(...fEntries.map(([, v]) => v), 1)

  const sentDir: Record<string, string> = {
    warming:    'Confidence building through the session',
    cooling:    'Pressure increasing toward the end',
    consistent: 'Stable confidence throughout',
  }
  const sentLabel = sentDir[session.sentiment_arc?.arc_direction ?? ''] ?? 'Consistent tone'

  return (
    <section>
      <span style={{ ...SECTION_TAG, marginBottom: 20 }}>Key Metrics</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>

        {/* Talk Ratio — 3 cols */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          style={{ gridColumn: 'span 3', ...CARD, minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <span style={SECTION_TAG}>Talk Ratio</span>
            <div style={{ ...PLAYFAIR, fontSize: 88 }}>{Math.round(student)}%</div>
            <p style={{ ...DM, color: MUTED, fontSize: 14, fontWeight: 300, marginTop: 8 }}>
              Student speaking time
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 28 }}>
            {[
              { label: 'Student', pct: student, color: PINK },
              { label: 'Tutor',   pct: tutor,   color: '#e0e0e0' },
              ...(silenceRaw > 1 ? [{ label: 'Silence', pct: silenceRaw, color: '#f0f0f0' }] : []),
            ].map((bar, i) => (
              <div key={bar.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ ...DM, fontSize: 12, color: LIGHT }}>{bar.label}</span>
                  <span style={{ ...DM, fontSize: 12, fontWeight: 600, color: INK }}>{Math.round(bar.pct)}%</span>
                </div>
                <div style={{ height: 12, background: '#f3f3f3', borderRadius: 6, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(bar.pct / total) * 100}%` }}
                    transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1], delay: i * 0.1 }}
                    style={{ height: '100%', background: bar.color, borderRadius: 6 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Filler Pressure — 5 cols */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          style={{ gridColumn: 'span 5', ...CARD, minHeight: 300 }}
        >
          <span style={SECTION_TAG}>Filler Pressure</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 28 }}>
            <span style={{ ...PLAYFAIR, fontSize: 88 }}>{filler?.total ?? 0}</span>
            <span style={{ ...DM, fontSize: 16, color: MUTED, fontWeight: 300 }}>total fillers</span>
          </div>
          {fEntries.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {fEntries.map(([topic, count], i) => {
                const isWorst = topic === filler?.worst_topic
                return (
                  <div key={topic}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                      <span style={{
                        ...DM, fontSize: 13,
                        color: isWorst ? INK : MUTED,
                        fontWeight: isWorst ? 600 : 300,
                        maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {topic}
                      </span>
                      <span style={{ ...DM, fontSize: 13, fontWeight: 700, color: isWorst ? PINK : LIGHT }}>{count}</span>
                    </div>
                    <div style={{ height: 24, background: '#f5f5f5', borderRadius: 12, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / fMax) * 100}%` }}
                        transition={{ duration: 0.85, ease: [0.4, 0, 0.2, 1], delay: i * 0.07 }}
                        style={{
                          height: '100%', borderRadius: 12,
                          background: isWorst
                            ? `linear-gradient(90deg, ${PINK}, #FF6BAE)`
                            : `linear-gradient(90deg, ${PINK}60, ${PINK}35)`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ ...DM, color: LIGHT, fontSize: 14 }}>No filler data available</p>
          )}
        </motion.div>

        {/* Sentiment Arc — 4 cols */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          style={{ gridColumn: 'span 4', ...CARD, minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <span style={SECTION_TAG}>Sentiment Arc</span>
            <div style={{ ...PLAYFAIR, fontSize: 88 }}>{session.sentiment_arc?.positive_pct ?? 0}%</div>
            <p style={{ ...DM, fontSize: 14, color: MUTED, fontStyle: 'italic', fontWeight: 300, marginTop: 8 }}>
              {sentLabel}
            </p>
          </div>
          <div style={{ marginTop: 20 }}>
            <SentimentSvg data={session.sentiment_arc} />
          </div>
        </motion.div>

      </div>
    </section>
  )
}

// ─── Insights panel ────────────────────────────────────────────────────────────

function InsightsPanel({ session }: { session: Session }) {
  const all      = deriveInsights(session)
  const positives = all.filter(i => i.positive).slice(0, 2)
  const negatives = all.filter(i => !i.positive).slice(0, 2)

  return (
    <section>
      <span style={{ ...SECTION_TAG, marginBottom: 20 }}>Session Insights</span>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{ ...CARD, background: '#fff8fb', padding: 40 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {positives.map((ins, i) => (
              <div key={i} style={{ display: 'flex', gap: 16 }}>
                <span style={{ color: PINK, fontSize: 20, fontWeight: 700, lineHeight: 1.2, flexShrink: 0 }}>✓</span>
                <div>
                  <p style={{ ...DM, fontSize: 16, fontWeight: 600, color: INK, marginBottom: 5 }}>{ins.text}</p>
                  {ins.detail && <p style={{ ...DM, fontSize: 13, color: LIGHT }}>{ins.detail}</p>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {negatives.map((ins, i) => (
              <div key={i} style={{ display: 'flex', gap: 16 }}>
                <span style={{ color: PINK, fontSize: 20, fontWeight: 700, lineHeight: 1.2, flexShrink: 0 }}>→</span>
                <div>
                  <p style={{ ...DM, fontSize: 16, fontWeight: 600, color: INK, marginBottom: 5 }}>{ins.text}</p>
                  {ins.detail && <p style={{ ...DM, fontSize: 13, color: LIGHT }}>{ins.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}

// ─── Performance section ───────────────────────────────────────────────────────

function PerformanceSection({ session }: { session: Session }) {
  const words    = session.new_words?.sample?.slice(0, 6) ?? []
  const examples = session.self_repairs?.examples?.slice(0, 2) ?? []
  const repairColor = (session.self_repairs?.count ?? 0) >= 3
    ? PINK : (session.self_repairs?.count === 0 ? LIGHT : PINK)

  return (
    <section>
      <span style={{ ...SECTION_TAG, marginBottom: 20 }}>Performance</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>

        {/* New Words — 6 cols */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          style={{ gridColumn: 'span 6', ...CARD, minHeight: 280 }}
        >
          <span style={SECTION_TAG}>New Words</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
            <span style={PLAYFAIR}>{session.new_words?.new_count ?? 0}</span>
            <span style={{ ...DM, fontSize: 16, color: MUTED, fontWeight: 300 }}>new words</span>
          </div>
          <p style={{ ...DM, fontSize: 13, color: LIGHT, marginBottom: 24 }}>
            {session.new_words?.total_vocab} total vocabulary
          </p>
          {words.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {words.map(w => (
                <span key={w} style={{
                  ...DM,
                  padding: '5px 14px', borderRadius: 20,
                  background: `${PINK}12`, color: PINK,
                  fontSize: 13, fontWeight: 500,
                  border: `1px solid ${PINK}22`,
                }}>
                  {w}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Self-Repair — 6 cols */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          style={{ gridColumn: 'span 6', ...CARD, minHeight: 280 }}
        >
          <span style={SECTION_TAG}>Self-Repair Rate</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
            <span style={{ ...PLAYFAIR, color: repairColor }}>{session.self_repairs?.count ?? 0}</span>
            <span style={{ ...DM, fontSize: 16, color: MUTED, fontWeight: 300 }}>self-corrections</span>
          </div>
          {session.self_repairs?.verdict && (
            <p style={{
              ...DM, fontSize: 14, color: '#444', lineHeight: 1.75,
              marginTop: 12, marginBottom: 20,
              overflow: 'hidden',
              display: '-webkit-box' as any,
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical' as any,
            }}>
              {session.self_repairs.verdict}
            </p>
          )}
          {examples.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {examples.map((ex, i) => (
                <blockquote key={i} style={{
                  borderLeft: `2px solid ${PINK}`,
                  paddingLeft: 12, margin: 0,
                  ...DM, fontSize: 13, color: MUTED,
                  fontStyle: 'italic', lineHeight: 1.6,
                }}>
                  "{ex.length > 110 ? ex.slice(0, 110) + '…' : ex}"
                </blockquote>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </section>
  )
}

// ─── Deep dive ─────────────────────────────────────────────────────────────────

function DeepDive({ session }: { session: Session }) {
  const [open, setOpen] = useState(false)

  const deepCards = [
    { span: 6, tag: 'Grammar',   title: 'Top 3 Errors',           subtitle: 'What went wrong — and the fix',  comp: <TopErrors data={session.top_errors} /> },
    { span: 6, tag: 'Avoidance', title: 'Gray Zones',             subtitle: 'Structures being avoided',        comp: <GrayZones data={session.gray_zones} /> },
    { span: 4, tag: 'Topics',    title: 'Topic Expansion',        subtitle: 'Is the vocabulary expanding?',    comp: <TopicExpansion data={session.topic_expansion} /> },
    { span: 4, tag: 'Agency',    title: 'Conversational Agency',  subtitle: 'Passenger or driver?',            comp: <AgencyGauge data={session.agency} /> },
    ...(!session.active_recall?.is_first_session
      ? [{ span: 4, tag: 'Retention', title: 'Active Recall', subtitle: 'Did last session stick?', comp: <ActiveRecall data={session.active_recall} /> }]
      : []),
    ...((session.code_switching?.count ?? 0) > 0
      ? [{
          span: 4, tag: 'Language', title: 'Code-Switching', subtitle: "When English wasn't enough",
          comp: (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <span style={{ ...PLAYFAIR, fontSize: 56 }}>{session.code_switching.count}</span>
                <span style={{ ...DM, fontSize: 14, color: MUTED }}>switches</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {session.code_switching.instances.slice(0, 3).map((inst, i) => (
                  <span key={i} style={{ ...DM, fontSize: 13, color: MUTED, fontStyle: 'italic' }}>"{inst}"</span>
                ))}
              </div>
            </div>
          ),
        }]
      : []),
  ]

  return (
    <section>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
          background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 2px',
        }}
      >
        <span style={{
          width: 4, height: 20, borderRadius: 2, flexShrink: 0,
          background: open ? PINK : '#ddd',
          transition: 'background 0.2s',
        }} />
        <span style={{
          ...DM, fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.35em',
          color: open ? INK : LIGHT,
          transition: 'color 0.2s',
        }}>
          Deep Dive
        </span>
        <div style={{ flex: 1, height: 1, background: '#eee' }} />
        <span style={{ ...DM, color: LIGHT, fontSize: 12 }}>{open ? 'Hide ↑' : 'Show ↓'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20, paddingTop: 20 }}>
              {deepCards.map(({ span, tag, title, subtitle, comp }) => (
                <div key={title} style={{ gridColumn: `span ${span}`, ...CARD }}>
                  <span style={SECTION_TAG}>{tag}</span>
                  <h3 style={{ ...DM, fontSize: 18, fontWeight: 600, color: INK, marginBottom: 4 }}>{title}</h3>
                  <p style={{ ...DM, fontSize: 14, color: LIGHT, fontWeight: 300, marginBottom: 20 }}>{subtitle}</p>
                  {comp}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

// ─── Progression table ─────────────────────────────────────────────────────────

function ProgressionTable({ data, labels }: {
  data: NonNullable<AnalysisResult['progression']>; labels: string[]
}) {
  const [open, setOpen] = useState(false)
  const mt = data.metrics_table

  const rows: [string, (number | string)[], 'cefr' | 'number', (v: any) => string][] = [
    ['CEFR',          mt.cefr,          'cefr',   v => v],
    ['Talk time %',   mt.talk_time_pct, 'number', v => `${v.toFixed(1)}%`],
    ['New words',     mt.new_words,     'number', v => String(v)],
    ['Total vocab',   mt.total_vocab,   'number', v => String(v)],
    ['Fillers',       mt.fillers,       'number', v => String(v)],
    ['Agency / 10',   mt.agency_score,  'number', v => v.toFixed(1)],
    ['Active recall', mt.active_recall, 'number', v => String(v)],
  ]

  return (
    <section>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
          background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 2px',
        }}
      >
        <span style={{
          width: 4, height: 20, borderRadius: 2, flexShrink: 0,
          background: open ? '#5FC7C2' : '#ddd',
          transition: 'background 0.2s',
        }} />
        <span style={{
          ...DM, fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.35em',
          color: open ? INK : LIGHT, transition: 'color 0.2s',
        }}>
          Session Comparison
        </span>
        <div style={{ flex: 1, height: 1, background: '#eee' }} />
        <span style={{ ...DM, color: LIGHT, fontSize: 12 }}>
          {data.cefr_journey[0]} → {data.cefr_journey[data.cefr_journey.length - 1]} &nbsp;{open ? '↑' : '↓'}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ ...CARD, padding: 0, overflow: 'hidden', marginTop: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', ...DM }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <th style={{ textAlign: 'left', padding: '14px 28px', fontSize: 11, fontWeight: 500, color: LIGHT, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Metric</th>
                    {labels.map(l => (
                      <th key={l} style={{ padding: '14px 20px', textAlign: 'right', fontSize: 11, fontWeight: 500, color: LIGHT }}>{l}</th>
                    ))}
                    {labels.length > 1 && (
                      <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: 11, fontWeight: 500, color: LIGHT }}>Trend</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, values, type, fmt]) => {
                    const changed = values.length > 1 &&
                      String(values[values.length - 1]) !== String(values[values.length - 2])
                    return (
                      <tr key={label} style={{ borderBottom: '1px solid #f9f9f9' }}>
                        <td style={{ padding: '12px 28px', fontSize: 13, color: LIGHT, fontWeight: 400 }}>{label}</td>
                        {(values as (number | string)[]).map((v, i) => (
                          <td key={i} style={{ padding: '12px 20px', textAlign: 'right', fontSize: 13 }}>
                            {type === 'cefr' ? (
                              <span style={{ fontWeight: 700, color: CEFR_COLOR[v as string] ?? LIGHT }}>{v}</span>
                            ) : (
                              <span style={{
                                color: changed && i === values.length - 1 ? INK : LIGHT,
                                fontWeight: changed && i === values.length - 1 ? 700 : 400,
                              }}>
                                {fmt(v)}
                              </span>
                            )}
                          </td>
                        ))}
                        {labels.length > 1 && (
                          <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                            <TrendBadge
                              prev={(values as (number | string)[])[values.length - 2]}
                              curr={(values as (number | string)[])[values.length - 1]}
                              type={type}
                            />
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

// ─── Session view ──────────────────────────────────────────────────────────────

function SessionView({ session, progression }: {
  session: Session
  progression: NonNullable<AnalysisResult['progression']> | null
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
      <KeyMetricsGrid session={session} />
      <InsightsPanel session={session} />
      <PerformanceSection session={session} />
      <DeepDive session={session} />
    </div>
  )
}

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function Dashboard({ data, onBack }: { data: AnalysisResult; onBack: () => void }) {
  const [activeSession, setActiveSession] = useState(0)
  const sessions = data.sessions ?? []

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <PageHeader
        data={data}
        sessions={sessions}
        activeSession={activeSession}
        setActiveSession={setActiveSession}
        onBack={onBack}
      />

      <div style={{ padding: '48px 48px 96px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSession}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <SessionView session={sessions[activeSession]} progression={data.progression} />
          </motion.div>
        </AnimatePresence>

        {data.progression && sessions.length > 1 && (
          <div style={{ marginTop: 56 }}>
            <ProgressionTable data={data.progression} labels={sessions.map(s => s.label)} />
          </div>
        )}
      </div>
    </div>
  )
}
