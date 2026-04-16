import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AnalysisResult, Session } from '../types'
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

const CEFR_COLOR: Record<string, string> = {
  A1: '#6F6F78', A2: '#3B82F6', B1: '#F59E0B',
  B2: '#F97316', C1: '#34D399', C2: '#8B5CF6',
}

const CEFR_RANK: Record<string, number> = {
  A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5,
}

const BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  PROGRESSION: { bg: 'rgba(52,211,153,0.12)',  color: '#059669' },
  PLATEAU:     { bg: 'rgba(251,191,36,0.15)',   color: '#D97706' },
  'CEFR DEMO': { bg: 'rgba(139,92,246,0.1)',    color: '#7C3AED' },
  LIVE:        { bg: 'rgba(59,130,246,0.1)',    color: '#2563EB' },
}

// ─── Metric Card ───────────────────────────────────────────────────────────────

function MetricCard({ number, tag, title, subtitle, children, accent = false }: {
  number: string; tag: string; title: string; subtitle: string;
  children: React.ReactNode; accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white border border-[#D9D9DE] p-6 flex flex-col gap-4"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-[#D1D5DB]">{number}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={accent
              ? { background: 'rgba(254,121,171,0.10)', color: '#FE79AB' }
              : { background: '#D9D9DE', color: '#6F6F78' }
            }
          >
            {tag}
          </span>
        </div>
        <h3 className="text-[#121114] font-semibold text-base">{title}</h3>
        <p className="text-[#6F6F78] text-xs mt-0.5">{subtitle}</p>
      </div>
      <div>{children}</div>
    </motion.div>
  )
}

// ─── Section Title ─────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-[#6F6F78] uppercase tracking-[0.1em] whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-[#D9D9DE]" />
    </div>
  )
}

// ─── Trend Badge ───────────────────────────────────────────────────────────────

function TrendBadge({ prev, curr, type }: {
  prev?: string | number; curr?: string | number; type: 'cefr' | 'number'
}) {
  if (prev == null || curr == null) return <span className="text-[#D1D5DB] text-xs">—</span>

  let direction: 'up' | 'down' | 'flat' = 'flat'

  if (type === 'cefr') {
    const rPrev = CEFR_RANK[prev as string] ?? -1
    const rCurr = CEFR_RANK[curr as string] ?? -1
    if (rCurr > rPrev) direction = 'up'
    else if (rCurr < rPrev) direction = 'down'
  } else {
    const diff = Number(curr) - Number(prev)
    if (diff > 0) direction = 'up'
    else if (diff < 0) direction = 'down'
  }

  const styles = {
    up:   { bg: 'rgba(52,211,153,0.12)', color: '#059669', icon: '↑' },
    down: { bg: 'rgba(239,68,68,0.10)',  color: '#EF4444', icon: '↓' },
    flat: { bg: '#D9D9DE',               color: '#6F6F78', icon: '—' },
  }
  const s = styles[direction]

  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.color }}
    >
      {s.icon}
    </span>
  )
}

// ─── Overview Strip ────────────────────────────────────────────────────────────

function OverviewStrip({ session, progression }: {
  session: Session;
  progression: NonNullable<AnalysisResult['progression']> | null;
}) {
  const cefrColor = CEFR_COLOR[session.cefr?.level] ?? '#6F6F78'
  const good = progression?.positive_count ?? 0
  const tot  = progression?.total_signals ?? 0
  const verdictColor  = good >= 4 ? '#059669' : good >= 2 ? '#D97706' : '#EF4444'
  const verdictBg     = good >= 4 ? 'rgba(52,211,153,0.06)' : good >= 2 ? 'rgba(251,191,36,0.06)' : 'rgba(239,68,68,0.06)'
  const verdictBorder = good >= 4 ? '#34D399' : good >= 2 ? '#FBBF24' : '#EF4444'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-[#D9D9DE] rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <div className="grid grid-cols-[2fr_1.8fr_1.4fr] divide-x divide-[#D9D9DE]">

        {/* CEFR — 40% */}
        <div className="p-6 flex items-start gap-4">
          <div
            className="text-5xl font-black px-4 py-2 rounded-xl shrink-0 leading-none"
            style={{ background: cefrColor + '18', color: cefrColor }}
          >
            {session.cefr?.level ?? '?'}
          </div>
          <div className="min-w-0">
            <div className="text-[#121114] font-semibold text-sm">CEFR Estimate</div>
            {session.cefr?.confidence && (
              <div className="text-[#34D399] text-xs font-medium mt-0.5">{session.cefr.confidence} confidence</div>
            )}
            {session.cefr?.reasoning && (
              <p className="text-[#6F6F78] text-xs mt-2 leading-relaxed line-clamp-3">{session.cefr.reasoning}</p>
            )}
          </div>
        </div>

        {/* Progression signals — 35% */}
        <div className="p-6 flex flex-col gap-3">
          {progression ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6F6F78] font-medium">Progression signals</span>
                <span className="text-sm font-bold" style={{ color: verdictColor }}>{good}/{tot}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {progression.signals.slice(0, 6).map(s => (
                  <span
                    key={s.name}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={s.positive
                      ? { background: 'rgba(52,211,153,0.08)', color: '#059669' }
                      : { background: 'rgba(239,68,68,0.08)',  color: '#EF4444' }
                    }
                  >
                    {s.positive ? '✓' : '✗'} {s.name}
                  </span>
                ))}
              </div>
              <div
                className="rounded-lg p-2.5 mt-auto"
                style={{ background: verdictBg, borderLeft: `2px solid ${verdictBorder}` }}
              >
                <p className="text-xs leading-relaxed" style={{ color: verdictColor }}>{progression.verdict}</p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-[#6F6F78] text-sm">
              Single session — no comparison yet
            </div>
          )}
        </div>

        {/* Session Summary — 25% */}
        <div className="p-6">
          <div className="text-xs font-medium text-[#6F6F78] uppercase tracking-wider mb-2">Session Summary</div>
          {session.session_summary ? (
            <p className="text-[#4B5563] text-sm leading-relaxed line-clamp-5">{session.session_summary}</p>
          ) : (
            <p className="text-[#6F6F78] text-sm">No summary available</p>
          )}
        </div>

      </div>
    </motion.div>
  )
}

// ─── Progression Table ─────────────────────────────────────────────────────────

function ProgressionTable({ data, labels }: {
  data: NonNullable<AnalysisResult['progression']>; labels: string[];
}) {
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-[#D9D9DE] rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <div className="px-6 py-4 border-b border-[#D9D9DE]">
        <h2 className="text-[#121114] font-semibold text-sm">Progression Table</h2>
        <p className="text-[#6F6F78] text-xs mt-0.5">
          {data.cefr_journey[0]} → {data.cefr_journey[data.cefr_journey.length - 1]}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#D9D9DE]">
              <th className="text-left px-6 py-3 text-[#6F6F78] font-medium text-xs">Metric</th>
              {labels.map(l => (
                <th key={l} className="px-4 py-3 text-right text-[#6F6F78] font-medium text-xs">{l}</th>
              ))}
              {labels.length > 1 && (
                <th className="px-4 py-3 text-center text-[#6F6F78] font-medium text-xs">Trend</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, values, type, fmt], ri) => (
              <tr
                key={label}
                className="border-b border-[#D9D9DE] transition-colors duration-150"
                style={{ background: ri % 2 === 0 ? '#FFFFFF' : '#F3F3F4' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F9F9FB')}
                onMouseLeave={e => (e.currentTarget.style.background = ri % 2 === 0 ? '#FFFFFF' : '#F3F3F4')}
              >
                <td className="px-6 py-2.5 text-[#6F6F78] text-xs font-medium">{label}</td>
                {(values as (number | string)[]).map((v, i) => (
                  <td key={i} className="px-4 py-2.5 text-right text-xs">
                    {type === 'cefr' ? (
                      <span className="font-bold" style={{ color: CEFR_COLOR[v as string] ?? '#6F6F78' }}>{v}</span>
                    ) : (
                      <span className="text-[#121114] font-semibold">{fmt(v)}</span>
                    )}
                  </td>
                ))}
                {labels.length > 1 && (
                  <td className="px-4 py-2.5 text-center">
                    <TrendBadge
                      prev={(values as (number | string)[])[values.length - 2]}
                      curr={(values as (number | string)[])[values.length - 1]}
                      type={type}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
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

        {/* Left: back + name + badge */}
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
            <div className="w-px h-4 bg-[#E5E7EB] shrink-0" />
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

        {/* Center: session tabs */}
        <div className="flex-1 flex items-center justify-center gap-1">
          {sessions.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveSession(i)}
              className="px-3 py-1 rounded-lg text-xs transition-all duration-200"
              style={activeSession === i
                ? { background: '#FE79AB', color: '#FFFFFF', fontWeight: 600 }
                : { background: '#D9D9DE', color: '#6F6F78' }
              }
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Right: CEFR journey badge */}
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
    <div className="flex flex-col gap-10">

      <OverviewStrip session={session} progression={progression} />

      {/* ── Fluency & Confidence ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5">
        <SectionTitle>Fluency &amp; Confidence</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <MetricCard number="01" tag="Base" title="Talk Ratio" subtitle="Who owned the floor">
            <TalkRatio
              studentPercent={session.talk_ratio.student_pct}
              tutorPercent={session.talk_ratio.tutor_pct}
              silencePercent={Math.max(0, 100 - session.talk_ratio.student_pct - session.talk_ratio.tutor_pct)}
            />
          </MetricCard>

          <MetricCard number="08" tag="Differentiator" title="Filler Pressure" subtitle="Where hesitation clusters by topic" accent>
            <FillerPressure data={session.filler_pressure} />
          </MetricCard>

          <MetricCard number="11" tag="Differentiator" title="Sentiment Arc" subtitle="Confidence shape through the session" accent>
            <SentimentArc data={session.sentiment_arc} />
          </MetricCard>

          <MetricCard number="07" tag="Differentiator" title="Self-Repair Rate" subtitle="Mistakes caught before the tutor" accent>
            <SelfRepairs data={session.self_repairs} />
          </MetricCard>
        </div>
      </div>

      {/* ── Vocabulary & Knowledge ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5">
        <SectionTitle>Vocabulary &amp; Knowledge</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <MetricCard number="02" tag="Base" title="New Words" subtitle="Vocabulary that appeared for the first time">
            <NewWords data={session.new_words} />
          </MetricCard>

          <MetricCard number="06" tag="Differentiator" title="Active Recall" subtitle="Did last session stick?" accent>
            <ActiveRecall data={session.active_recall} />
          </MetricCard>

          <MetricCard number="12" tag="Differentiator" title="Topic Expansion" subtitle="Is the student's world growing?" accent>
            <TopicExpansion data={session.topic_expansion} />
          </MetricCard>

          <MetricCard number="09" tag="Differentiator" title="Code-Switching" subtitle="When English wasn't enough" accent>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold text-[#FE79AB]">{session.code_switching?.count ?? 0}</span>
                <span className="text-[#6F6F78] text-sm">switches</span>
              </div>
              {(session.code_switching?.count ?? 0) === 0 ? (
                <span className="text-xs text-[#059669]">✓ Stayed in English throughout</span>
              ) : (
                <div className="flex flex-col gap-1">
                  {session.code_switching.instances.slice(0, 3).map((inst, i) => (
                    <span key={i} className="text-xs text-[#6F6F78] italic">"{inst}"</span>
                  ))}
                </div>
              )}
            </div>
          </MetricCard>
        </div>
      </div>

      {/* ── Grammar & Structure ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5">
        <SectionTitle>Grammar &amp; Structure</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <MetricCard number="03" tag="Base" title="Top 3 Errors" subtitle="What went wrong — and the fix">
            <TopErrors data={session.top_errors} />
          </MetricCard>

          <MetricCard number="10" tag="Differentiator" title="Gray Zones" subtitle="Grammar avoided — not just wrong" accent>
            <GrayZones data={session.gray_zones} />
          </MetricCard>

          <MetricCard number="05" tag="Differentiator" title="Conversational Agency" subtitle="Passenger or driver?" accent>
            <AgencyGauge data={session.agency} />
          </MetricCard>
        </div>
      </div>

    </div>
  )
}

// ─── Root Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard({ data, onBack }: { data: AnalysisResult; onBack: () => void }) {
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

      <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col gap-8">

        {/* Progression Table (multi-session only) */}
        {data.progression && sessions.length > 1 && (
          <ProgressionTable data={data.progression} labels={sessions.map(s => s.label)} />
        )}

        {/* Session Content */}
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

      </div>
    </div>
  )
}
