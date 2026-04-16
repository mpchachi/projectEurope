import { useState, useEffect, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AnalysisResult, Session } from '../types'

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Dashboard] render error:', error, info.componentStack)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          margin: '48px auto', maxWidth: 520, padding: '28px 32px',
          background: '#fff', borderRadius: 12, border: '1px solid #EAEAEA',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#EF4444', marginBottom: 8 }}>
            Dashboard render error
          </p>
          <pre style={{
            fontSize: 11, color: '#6B7280', whiteSpace: 'pre-wrap',
            wordBreak: 'break-word', lineHeight: 1.6,
          }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 16, fontSize: 12, fontWeight: 500,
              color: '#FE79AB', background: 'none', border: 'none',
              cursor: 'pointer', padding: 0,
            }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
import TalkRatio from './metrics/TalkRatio'
import NewWords from './metrics/NewWords'
import TopErrors from './metrics/TopErrors'
import AgencyGauge from './metrics/AgencyGauge'
import SentimentArc from './metrics/SentimentArc'
import GrayZones from './metrics/GrayZones'
import FillerPressure from './metrics/FillerPressure'
import TopicExpansion from './metrics/TopicExpansion'
import SelfRepairs from './metrics/SelfRepairs'
import ActiveRecall from './metrics/ActiveRecall'

const CEFR_RANK: Record<string, number> = {
  A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5,
}
const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  PROGRESSION: { bg: 'rgba(52,211,153,0.12)',  color: '#059669' },
  PLATEAU:     { bg: 'rgba(251,191,36,0.15)',   color: '#D97706' },
  'CEFR DEMO': { bg: 'rgba(139,92,246,0.1)',    color: '#7C3AED' },
  LIVE:        { bg: 'rgba(59,130,246,0.1)',    color: '#2563EB' },
}

// ─── CEFR Progress Bar ─────────────────────────────────────────────────────────

function CefrProgressBar({ session, progression }: {
  session: Session;
  progression: NonNullable<AnalysisResult['progression']> | null;
}) {
  const currentLevel = session.cefr?.level ?? 'A1'
  const currentRank  = CEFR_RANK[currentLevel] ?? 0
  const targetFill   = (currentRank + 1) / 6 * 100

  const journey   = progression?.cefr_journey ?? []
  const startLevel = journey.length >= 2 ? journey[0] : null
  const startRank  = startLevel && startLevel !== currentLevel ? (CEFR_RANK[startLevel] ?? null) : null

  const [fillWidth, setFillWidth]       = useState(0)
  const [markersVisible, setMarkersVisible] = useState(false)

  useEffect(() => {
    setFillWidth(0)
    setMarkersVisible(false)
    const t1 = setTimeout(() => setFillWidth(targetFill), 120)
    const t2 = setTimeout(() => setMarkersVisible(true), 1350)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [currentLevel, targetFill])

  const confidence = session.cefr?.confidence

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl"
      style={{ padding: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #D9D9DE' }}
    >
      {/* Bar + markers */}
      <div style={{ position: 'relative', paddingBottom: 40, marginBottom: 4 }}>

        {/* Track */}
        <div style={{
          height: 40, borderRadius: 999, background: '#EFEFF1',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Animated gradient fill */}
          <div style={{
            position: 'absolute', inset: '0 auto 0 0',
            width: `${fillWidth}%`,
            background: 'linear-gradient(to right, #5FC7C2, #FE79AB)',
            transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
            borderRadius: 'inherit',
          }} />

          {/* Segment dividers */}
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{
              position: 'absolute', left: `${i / 6 * 100}%`,
              top: 0, bottom: 0, width: 2,
              background: 'rgba(255,255,255,0.45)', zIndex: 2,
            }} />
          ))}

          {/* Labels */}
          {CEFR_LEVELS.map((lv, i) => {
            const isFilled = (i + 1) / 6 * 100 <= fillWidth + 0.5
            return (
              <div key={lv} style={{
                position: 'absolute',
                left: `${(i + 0.5) / 6 * 100}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 13, fontWeight: 700,
                color: isFilled ? '#FFFFFF' : '#6F6F78',
                transition: 'color 0.15s',
                zIndex: 3, userSelect: 'none',
              }}>
                {lv}
              </div>
            )
          })}
        </div>

        {/* Start marker */}
        {startRank !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: markersVisible ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute',
              left: `${startRank / 6 * 100}%`,
              top: 40,
              transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}
          >
            <div style={{ width: 2, height: 6, background: '#5FC7C2' }} />
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: '#5FC7C2', border: '2px solid white',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }} />
            <p style={{ fontSize: 11, color: '#6F6F78', marginTop: 3, whiteSpace: 'nowrap' }}>Started</p>
          </motion.div>
        )}

        {/* Current marker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: markersVisible ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'absolute',
            left: `${Math.min(99, targetFill)}%`,
            top: 40,
            transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}
        >
          <div style={{ width: 2, height: 6, background: '#FE79AB' }} />
          <div style={{ position: 'relative', width: 16, height: 16 }}>
            {/* Pulsing outer ring */}
            <motion.div
              animate={{ scale: [1, 1.7, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: -4,
                borderRadius: '50%', border: '2px solid #FE79AB',
              }}
            />
            {/* Dot */}
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              background: '#FE79AB', border: '3px solid white',
              boxShadow: '0 2px 6px rgba(254,121,171,0.45)',
            }} />
          </div>
          <p style={{ fontSize: 11, color: '#FE79AB', fontWeight: 600, marginTop: 3, whiteSpace: 'nowrap' }}>
            Current
          </p>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center gap-2.5">
        <span style={{ fontSize: 14, fontWeight: 600, color: '#121114' }}>CEFR Estimate</span>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#121114' }}>
          {currentLevel}
        </span>
        {confidence && (
          <span style={{
            fontSize: 12, color: '#059669', fontWeight: 600,
            background: 'rgba(52,211,153,0.10)', borderRadius: 20,
            padding: '3px 12px',
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 6v6c0 5.25 3.8 10.15 9 11.5C18.2 22.15 22 17.25 22 12V6L12 2z" fill="#059669" />
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {confidence} confidence
          </span>
        )}
        {session.cefr?.reasoning && (
          <span className="ml-auto text-xs text-[#6F6F78] max-w-xs text-right line-clamp-1 hidden md:block">
            {session.cefr.reasoning}
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ─── Overview Strip ────────────────────────────────────────────────────────────

function SignalsCard({ progression }: {
  progression: NonNullable<AnalysisResult['progression']> | null;
}) {
  if (!progression) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-[#6F6F78] uppercase tracking-widest font-medium">Signals</p>
        <p className="text-sm text-[#6F6F78]">First session — no comparison yet</p>
      </div>
    )
  }

  const { positive_count, total_signals, signals } = progression
  const isPlat = positive_count < Math.ceil(total_signals / 2)

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* KPI */}
      <div className="flex items-baseline gap-1">
        <span style={{ fontSize: 36, fontWeight: 800, color: '#FE79AB', lineHeight: 1 }}>
          {positive_count}
        </span>
        <span style={{ fontSize: 20, color: '#6F6F78', lineHeight: 1 }}>
          /{total_signals}
        </span>
      </div>
      <p className="text-xs text-[#6F6F78] uppercase tracking-widest -mt-1">signals</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {signals.map(s => (
          <span
            key={s.name}
            className="text-xs rounded-full px-2.5 py-1 font-medium"
            style={s.positive
              ? { background: 'rgba(52,211,153,0.08)', color: '#059669' }
              : { background: 'rgba(239,68,68,0.07)',  color: '#EF4444' }
            }
          >
            {s.positive ? '✓' : '✗'} {s.name}
          </span>
        ))}
      </div>

      {/* Plateau warning */}
      {isPlat && (
        <div
          className="mt-auto rounded-r-lg text-xs"
          style={{
            borderLeft: '3px solid #FBBF24',
            background: 'rgba(251,191,36,0.06)',
            color: '#D97706', padding: '8px 12px',
          }}
        >
          Plateau risk — review tutor strategy
        </div>
      )}
    </div>
  )
}

function InsightCard({ session, progression }: {
  session: Session;
  progression: NonNullable<AnalysisResult['progression']> | null;
}) {
  const good = progression?.positive_count ?? 0
  const tot  = progression?.total_signals ?? 1
  const improving = good >= Math.ceil(tot * 0.6)
  const verdict = progression?.verdict ?? session.cefr?.reasoning ?? ''

  // derive secondary line from signals
  const negSignals = (progression?.signals ?? []).filter(s => !s.positive).map(s => s.name)
  const secondary = negSignals.length
    ? `Areas to watch: ${negSignals.slice(0, 2).join(', ')}`
    : progression
      ? 'All tracked indicators are moving in the right direction'
      : 'Run a second session to unlock progression comparison'

  return (
    <div className="flex flex-col gap-3">
      {/* Icon */}
      {improving ? (
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(52,211,153,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 17L12 10l7 7" />
            <path d="M12 10V3" />
          </svg>
        </div>
      ) : (
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(251,191,36,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
      )}

      {/* Main text */}
      <p style={{ fontSize: 14, fontWeight: 500, color: '#121114', lineHeight: 1.5 }}>
        {verdict || (improving ? 'Student is making solid progress across key metrics.' : 'Mixed signals — some areas need attention.')}
      </p>

      {/* Secondary */}
      <p style={{ fontSize: 13, color: '#6F6F78', lineHeight: 1.5 }}>
        {secondary}
      </p>
    </div>
  )
}

function SummaryCard({ summary }: { summary: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex flex-col gap-2 h-full">
      <p className="text-[11px] text-[#6F6F78] uppercase tracking-[1.5px] font-medium">Session Summary</p>

      <div style={{
        overflow: 'hidden',
        maxHeight: expanded ? 600 : 76,
        transition: 'max-height 0.3s ease',
      }}>
        <p style={{
          fontSize: 13, color: '#4B5563', lineHeight: 1.6,
          display: !expanded ? '-webkit-box' : undefined,
          WebkitLineClamp: !expanded ? 3 : undefined,
          WebkitBoxOrient: !expanded ? 'vertical' : undefined,
          overflow: !expanded ? 'hidden' : undefined,
        }}>
          {summary || 'No summary available for this session.'}
        </p>
      </div>

      {summary && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-auto text-left text-xs font-semibold"
          style={{ color: '#FE79AB', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
        >
          {expanded ? 'Collapse ↑' : 'Read full summary ↓'}
        </button>
      )}
    </div>
  )
}

function OverviewStrip({ session, progression }: {
  session: Session;
  progression: NonNullable<AnalysisResult['progression']> | null;
}) {
  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: 14,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    border: '1px solid #D9D9DE',
    padding: 20,
    flex: 1,
    minHeight: 180,
    display: 'flex',
    flexDirection: 'column',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      style={{ display: 'flex', gap: 16 }}
      className="flex-col md:flex-row"
    >
      <div style={cardStyle}>
        <SignalsCard progression={progression} />
      </div>
      <div style={cardStyle}>
        <InsightCard session={session} progression={progression} />
      </div>
      <div style={cardStyle}>
        <SummaryCard summary={session.session_summary} />
      </div>
    </motion.div>
  )
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
      <span style={{
        fontSize: 12, fontWeight: 500, color: '#9CA3AF',
        textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
      }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: '#EAEAEA' }} />
    </div>
  )
}

// ─── Metric Header ────────────────────────────────────────────────────────────

function MetricHeader({ number, title, subtitle }: {
  number: string; title: string; subtitle: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 400, color: '#D1D5DB', lineHeight: 1 }}>{number}</div>
      <h3 style={{
        fontSize: 15, fontWeight: 600, color: '#121118',
        letterSpacing: '-0.01em', margin: '4px 0 3px', lineHeight: 1.2,
      }}>
        {title}
      </h3>
      <p style={{ fontSize: 12, fontWeight: 400, color: '#9CA3AF', lineHeight: 1.3 }}>{subtitle}</p>
    </div>
  )
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ number, title, subtitle, children, style }: {
  number: string; title: string; subtitle: string;
  children: React.ReactNode; style?: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        border: '1px solid #EAEAEA',
        boxShadow: hovered ? '0 2px 4px rgba(0,0,0,0.06)' : '0 1px 2px rgba(0,0,0,0.04)',
        padding: 20,
        transition: 'box-shadow 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <MetricHeader number={number} title={title} subtitle={subtitle} />
      <div style={{ flex: 1 }}>{children}</div>
    </motion.div>
  )
}

// ─── Dual Metric Card (Talk Ratio + Agency) ───────────────────────────────────

function DualMetricCard({ session }: { session: Session }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        border: '1px solid #EAEAEA',
        boxShadow: hovered ? '0 2px 4px rgba(0,0,0,0.06)' : '0 1px 2px rgba(0,0,0,0.04)',
        padding: 20,
        transition: 'box-shadow 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <MetricHeader number="01" title="Talk Ratio" subtitle="Who owned the floor" />
      {session.talk_ratio ? (
        <TalkRatio
          studentPercent={session.talk_ratio.student_pct}
          tutorPercent={session.talk_ratio.tutor_pct}
          silencePercent={Math.max(0, 100 - session.talk_ratio.student_pct - session.talk_ratio.tutor_pct)}
        />
      ) : (
        <p style={{ fontSize: 13, color: '#9CA3AF' }}>No data</p>
      )}

      <div style={{ height: 1, background: '#F0F0F0', margin: '20px 0' }} />

      <MetricHeader number="05" title="Conversational Agency" subtitle="Did the student lead or follow?" />
      <div style={{ flex: 1 }}>
        {session.agency ? (
          <AgencyGauge data={session.agency} />
        ) : (
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>No data</p>
        )}
      </div>
    </motion.div>
  )
}

// ─── Sticky Header ─────────────────────────────────────────────────────────────

function StickyHeader({ data, sessions, activeSession, setActiveSession, onBack }: {
  data: AnalysisResult;
  sessions: Session[];
  activeSession: number;
  setActiveSession: (i: number) => void;
  onBack: () => void;
}) {
  const [scrolled, setScrolled] = useState(false)
  const preset = data.preset
  const badgeStyle = preset ? (BADGE_STYLE[preset.badge] ?? BADGE_STYLE.PROGRESSION) : null
  const cefrJourney = data.progression?.cefr_journey

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#D9D9DE]"
      style={{
        boxShadow: scrolled ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
        transition: 'box-shadow 0.2s',
        height: 56,
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center gap-4">

        <button
          onClick={onBack}
          className="text-[#6F6F78] hover:text-[#121114] transition-colors text-sm flex items-center gap-1.5 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {preset && (
          <>
            <div className="w-px h-4 bg-[#D9D9DE] shrink-0" />
            <span className="text-[#121114] font-bold text-sm shrink-0">{preset.name}</span>
            {badgeStyle && (
              <span
                className="text-xs font-medium rounded-md px-2.5 py-1 shrink-0"
                style={{ background: badgeStyle.bg, color: badgeStyle.color }}
              >
                {preset.badge}
              </span>
            )}
          </>
        )}

        <div className="flex-1 flex items-center justify-center gap-1">
          {sessions.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveSession(i)}
              className="px-3 py-1 rounded-lg text-xs transition-all duration-200"
              style={activeSession === i
                ? { background: '#FE79AB', color: '#FFFFFF', fontWeight: 600 }
                : { background: '#EFEFF1', color: '#6F6F78' }
              }
            >
              {s.label}
            </button>
          ))}
        </div>

        {cefrJourney && cefrJourney.length >= 2 && (
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0"
            style={{ background: 'rgba(254,121,171,0.08)', color: '#FE79AB' }}
          >
            {cefrJourney[0]} → {cefrJourney[cefrJourney.length - 1]}
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Session View ──────────────────────────────────────────────────────────────

function SessionView({ session, progression }: {
  session: Session;
  progression: NonNullable<AnalysisResult['progression']> | null;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 48 }}>

      <CefrProgressBar session={session} progression={progression} />
      <OverviewStrip   session={session} progression={progression} />

      {/* ── A: Session Dynamics ───────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Session Dynamics</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] items-stretch" style={{ gap: 12 }}>

          {/* Left 60% — Talk Ratio + Agency stacked in one card */}
          <DualMetricCard session={session} />

          {/* Right 40% — three cards of equal height */}
          <div className="flex flex-col" style={{ gap: 12 }}>
            <MetricCard
              number="07"
              title="Self-Repair Rate"
              subtitle="Self-corrections before tutor intervened"
              style={{ flex: 1 }}
            >
              <SelfRepairs data={session.self_repairs} />
            </MetricCard>

            <MetricCard
              number="08"
              title="Filler Pressure Map"
              subtitle="Where hesitation clusters by topic"
              style={{ flex: 1 }}
            >
              <FillerPressure data={session.filler_pressure} />
            </MetricCard>

            <MetricCard
              number="11"
              title="Sentiment Arc"
              subtitle="Confidence curve through the session"
              style={{ flex: 1 }}
            >
              <SentimentArc data={session.sentiment_arc} />
            </MetricCard>
          </div>

        </div>
      </div>

      {/* ── B: Learning Between Sessions ──────────────────────────────────────── */}
      <div>
        <SectionLabel>Learning Between Sessions</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] items-stretch" style={{ gap: 12 }}>

          {/* Left 40% — New Words + Active Recall stacked */}
          <div className="flex flex-col" style={{ gap: 12 }}>
            <MetricCard
              number="02"
              title="New Words"
              subtitle="Vocabulary that appeared for the first time"
              style={{ flex: 1 }}
            >
              <NewWords data={session.new_words} />
            </MetricCard>

            <MetricCard
              number="06"
              title="Active Recall"
              subtitle="Words from previous sessions that reappeared"
              style={{ flex: 1 }}
            >
              <ActiveRecall data={session.active_recall} />
            </MetricCard>
          </div>

          {/* Right 60% — Topic Expansion single tall card */}
          <MetricCard
            number="12"
            title="Topic Expansion"
            subtitle="How the conversation universe grows"
            style={{ minHeight: 400, height: '100%' }}
          >
            <TopicExpansion data={session.topic_expansion} />
          </MetricCard>

        </div>
      </div>

      {/* ── C: Diagnostic ─────────────────────────────────────────────────────── */}
      <div style={{ paddingBottom: 48 }}>
        <SectionLabel>Diagnostic</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 12 }}>

          <MetricCard number="03" title="Top 3 Errors" subtitle="Grammar and vocabulary corrections">
            <TopErrors data={session.top_errors} />
          </MetricCard>

          <MetricCard number="10" title="Gray Zones Map" subtitle="Structures the student avoids">
            <GrayZones data={session.gray_zones} />
          </MetricCard>

          <MetricCard number="09" title="Code-Switching" subtitle="Moments of switching to native language">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 28, fontWeight: 600, color: '#FE79AB', lineHeight: 1 }}>
                  {session.code_switching?.count ?? 0}
                </span>
                <span style={{ fontSize: 14, color: '#9CA3AF' }}>switches</span>
              </div>
              {(session.code_switching?.count ?? 0) === 0 ? (
                <div
                  className="flex items-center gap-2 rounded-md px-3 py-2"
                  style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ fontSize: 12, color: '#059669', fontWeight: 500 }}>Stayed in English throughout</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {session.code_switching.instances.slice(0, 3).map((inst, i) => (
                    <p key={i} style={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic', lineHeight: 1.5 }}>
                      "{inst}"
                    </p>
                  ))}
                </div>
              )}
            </div>
          </MetricCard>

        </div>
      </div>

    </div>
  )
}

// ─── Root Dashboard ────────────────────────────────────────────────────────────

function DashboardInner({ data, onBack }: { data: AnalysisResult; onBack: () => void }) {
  const [activeSession, setActiveSession] = useState(0)
  const sessions = data.sessions ?? []

  return (
    <div className="min-h-screen bg-[#F3F3F4]">
      <StickyHeader
        data={data}
        sessions={sessions}
        activeSession={activeSession}
        setActiveSession={setActiveSession}
        onBack={onBack}
      />

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {sessions[activeSession] ? (
            <motion.div
              key={activeSession}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <SessionView session={sessions[activeSession]} progression={data.progression} />
            </motion.div>
          ) : (
            <p style={{ fontSize: 13, color: '#9CA3AF', padding: '48px 0' }}>No session data available.</p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function Dashboard({ data, onBack }: { data: AnalysisResult; onBack: () => void }) {
  return (
    <ErrorBoundary>
      <DashboardInner data={data} onBack={onBack} />
    </ErrorBoundary>
  )
}
