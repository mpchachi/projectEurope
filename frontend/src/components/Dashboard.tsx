import { useState, useEffect, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AnalysisResult, Session } from '../types'
import { TypewriterEffect, toWords } from './ui/TypewriterEffect'
import { EncryptedText } from './ui/EncryptedText'
import { CountUp } from './ui/CountUp'
import { RevealRow } from './ui/RevealRow'
import { MetricTooltip } from './ui/MetricTooltip'

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

import NewWordsHero   from './NewWordsHero'
import WordsStuck     from './WordsStuck'
import TalkRatio      from './metrics/TalkRatio'
import TopErrors      from './metrics/TopErrors'
import AgencyGauge    from './metrics/AgencyGauge'
import SentimentArc   from './metrics/SentimentArc'
import GrayZones      from './metrics/GrayZones'
import FillerPressure from './metrics/FillerPressure'
import TopicExpansion from './metrics/TopicExpansion'
import SelfRepairs    from './metrics/SelfRepairs'
import ActiveRecall   from './metrics/ActiveRecall'

const CEFR_RANK: Record<string, number>   = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5 }
const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

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

// ─── CEFR minimal track ───────────────────────────────────────────────────────

function CefrTrack({ session, progression }: {
  session: Session
  progression: NonNullable<AnalysisResult['progression']> | null
}) {
  const currentLevel = session.cefr?.level ?? 'A1'
  const currentRank  = CEFR_RANK[currentLevel] ?? 0
  const targetFill   = (currentRank + 1) / 6 * 100

  const journey    = progression?.cefr_journey ?? []
  const startLevel = journey.length >= 2 ? journey[0] : null
  const startRank  = startLevel && startLevel !== currentLevel ? (CEFR_RANK[startLevel] ?? null) : null

  const [fill, setFill] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setFill(targetFill), 100)
    return () => clearTimeout(t)
  }, [targetFill])

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ position: 'relative', height: 4, background: '#F0F0F0', borderRadius: 2, marginBottom: 10 }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${fill}%`, background: T.ink, borderRadius: 2,
          transition: 'width 1.1s cubic-bezier(0.4,0,0.2,1)',
        }} />
        <div style={{
          position: 'absolute',
          left: `${Math.min(98, fill)}%`,
          top: '50%', transform: 'translate(-50%, -50%)',
          width: 10, height: 10, borderRadius: '50%',
          background: T.accent, border: '2px solid white',
          boxShadow: '0 0 0 2px rgba(255,77,126,0.2)',
          transition: 'left 1.1s cubic-bezier(0.4,0,0.2,1)',
        }} />
        {startRank !== null && (
          <div style={{
            position: 'absolute',
            left: `${startRank / 6 * 100}%`,
            top: '50%', transform: 'translate(-50%, -50%)',
            width: 7, height: 7, borderRadius: '50%',
            background: '#D1D5DB', border: '2px solid white',
          }} />
        )}
      </div>
      <div style={{ display: 'flex' }}>
        {CEFR_LEVELS.map(lv => (
          <div key={lv} style={{
            flex: 1, textAlign: 'center',
            fontSize: 10, fontWeight: lv === currentLevel ? 700 : 400,
            color: lv === currentLevel ? T.ink : T.muted,
            letterSpacing: '0.04em',
          }}>
            {lv}
          </div>
        ))}
      </div>
      {startLevel && startLevel !== currentLevel && (
        <div style={{ marginTop: 8, fontSize: 11, color: T.muted }}>
          Journey: {startLevel} → {currentLevel}
        </div>
      )}
    </div>
  )
}

// ─── Section 1: Overview ──────────────────────────────────────────────────────

function OverviewSection({ session, progression }: {
  session: Session
  progression: NonNullable<AnalysisResult['progression']> | null
}) {
  const [expanded, setExpanded] = useState(false)
  const currentLevel = session.cefr?.level ?? '—'
  const confidence   = session.cefr?.confidence

  const good = progression?.positive_count ?? 0
  const tot  = progression?.total_signals ?? 1
  const improving = progression ? good >= Math.ceil(tot * 0.6) : null
  const verdict = progression?.verdict ?? session.cefr?.reasoning ?? ''
  const negSignals = (progression?.signals ?? []).filter(s => !s.positive).map(s => s.name)

  return (
    <Section label="Session Overview">
      <PremiumCard>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '0 40px' }}>

          {/* Left: CEFR */}
          <div>
            <div style={T.metricLabel}>CEFR Level</div>

            <div style={{ fontSize: 96, fontWeight: 800, color: T.ink, lineHeight: 1, letterSpacing: '-0.05em', marginBottom: 10 }}>
              {currentLevel}
            </div>

            {confidence && (
              <span style={{
                display: 'inline-block', fontSize: 11, fontWeight: 600,
                color: '#059669', background: 'rgba(5,150,105,0.08)',
                borderRadius: 4, padding: '3px 10px', letterSpacing: '0.03em',
              }}>
                {confidence} confidence
              </span>
            )}

            {session.cefr?.reasoning && (
              <p style={{ fontSize: 13, color: T.gray, lineHeight: 1.55, marginTop: 10, maxWidth: 300 }}>
                {session.cefr.reasoning}
              </p>
            )}

            <CefrTrack session={session} progression={progression} />
          </div>

          {/* Vertical rule */}
          <div style={{ background: '#EBEBEB' }} />

          {/* Right: Signals + Insight + Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Insight */}
            <div>
              <div style={T.metricLabel}>Session Insight</div>
              {improving !== null && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', marginBottom: 8,
                  color: improving ? '#059669' : '#B45309',
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: improving ? '#059669' : '#FBBF24' }} />
                  {improving ? 'Progressing' : 'Plateau risk'}
                </div>
              )}
              <p style={{ fontSize: 14, color: T.ink, lineHeight: 1.6 }}>
                <TypewriterEffect
                  words={toWords(verdict || (improving
                    ? 'Student is making solid progress across key metrics.'
                    : 'Mixed signals — some areas need attention.'))}
                  typingSpeed={34}
                />
              </p>
              {negSignals.length > 0 && (
                <p style={{ fontSize: 12, color: T.gray, marginTop: 6, lineHeight: 1.5 }}>
                  <TypewriterEffect
                    words={toWords(`Next focus: ${negSignals.slice(0, 2).join(', ')}.`)}
                    typingSpeed={40}
                  />
                </p>
              )}
            </div>

            {/* Signals */}
            {progression && (
              <div>
                <div style={T.metricLabel}>Progression Signals</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: T.ink, lineHeight: 1, letterSpacing: '-0.03em' }}>
                    <CountUp value={progression.positive_count} delay={0} />
                  </span>
                  <span style={{ fontSize: 18, color: '#D1D5DB' }}>/{progression.total_signals}</span>
                  <span style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>positive</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {progression.signals.map(s => (
                    <span key={s.name} style={{
                      fontSize: 11, padding: '3px 8px', borderRadius: 3, fontWeight: 500,
                      ...(s.positive
                        ? { background: 'rgba(5,150,105,0.07)',  color: '#059669' }
                        : { background: 'rgba(239,68,68,0.06)',  color: '#DC2626' })
                    }}>
                      {s.positive ? '✓' : '✗'} {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {session.session_summary && (
              <div>
                <div style={T.metricLabel}>Session Summary</div>
                <div style={{ overflow: 'hidden', maxHeight: expanded ? 600 : 66, transition: 'max-height 0.3s ease' }}>
                  <p style={{
                    fontSize: 13, color: '#4B5563', lineHeight: 1.65,
                    display: !expanded ? '-webkit-box' : undefined,
                    WebkitLineClamp: !expanded ? 3 : undefined,
                    WebkitBoxOrient: !expanded ? 'vertical' : undefined,
                    overflow: !expanded ? 'hidden' : undefined,
                  }}>
                    {session.session_summary}
                  </p>
                </div>
                <button
                  onClick={() => setExpanded(e => !e)}
                  style={{ marginTop: 6, fontSize: 11, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.ink)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
                >
                  {expanded ? 'Collapse ↑' : 'Expand ↓'}
                </button>
              </div>
            )}

          </div>
        </div>
      </PremiumCard>
    </Section>
  )
}

// ─── Section 2: Communication ─────────────────────────────────────────────────

function CommunicationSection({ session }: { session: Session }) {
  return (
    <Section label="Communication">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        <PremiumCard why="Output hypothesis (Swain, 1985): comprehensible output — not just input — is what drives real acquisition. Speaking time is the most honest proxy for that.">
          <div style={T.metricLabel}>Talk Ratio</div>
          {session.talk_ratio ? (
            <TalkRatio
              studentPercent={session.talk_ratio.student_pct}
              tutorPercent={session.talk_ratio.tutor_pct}
              silencePercent={Math.max(0, 100 - session.talk_ratio.student_pct - session.talk_ratio.tutor_pct)}
            />
          ) : <p style={{ fontSize: 13, color: T.muted }}>No data</p>}
        </PremiumCard>

        <PremiumCard why="Conversational initiative predicts long-term retention better than accuracy scores (Lantolf, 2000). A student who leads the conversation owns the language.">
          <div style={T.metricLabel}>Conversational Agency</div>
          {session.agency
            ? <AgencyGauge data={session.agency} />
            : <p style={{ fontSize: 13, color: T.muted }}>No data</p>}
        </PremiumCard>

      </div>
    </Section>
  )
}

// ─── Section 3: Session Patterns ─────────────────────────────────────────────

function PatternsSection({ session }: { session: Session }) {
  return (
    <Section label="Session Patterns">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        <PremiumCard why="Self-repair correlates with metalinguistic awareness — the internal monitor catching errors before they fossilise. First described by Levelt (1983) as a key marker of implicit knowledge forming.">
          <div style={T.metricLabel}>Self-Repair Rate</div>
          <SelfRepairs data={session.self_repairs} />
        </PremiumCard>

        <PremiumCard why="Disfluencies don't distribute randomly — they cluster around domains where cognitive load exceeds automaticity. The topic with the most fillers is the student's exact next frontier.">
          <div style={T.metricLabel}>Filler Pressure</div>
          <FillerPressure data={session.filler_pressure} />
        </PremiumCard>

        <PremiumCard why="Derived from Deepgram sentiment per utterance. Confidence isn't flat across a session — it peaks and dips with cognitive load. Knowing when the dip happened is more useful than knowing the average.">
          <div style={T.metricLabel}>Confidence Arc</div>
          <SentimentArc data={session.sentiment_arc} />
        </PremiumCard>

      </div>
    </Section>
  )
}

// ─── Section 4: Vocabulary ────────────────────────────────────────────────────

function VocabularySection({ session }: { session: Session }) {
  return (
    <Section label="Vocabulary">

      {/* Words that stuck — replaces the old repeated New Words card */}
      <WordsStuck session={session} />

      {/* Active Recall + Topic Expansion */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16 }}>

        <PremiumCard>
          <div style={T.metricLabel}>Active Recall</div>
          <ActiveRecall data={session.active_recall} />
        </PremiumCard>

        <PremiumCard>
          <div style={T.metricLabel}>Topic Expansion</div>
          <TopicExpansion data={session.topic_expansion} />
        </PremiumCard>

      </div>
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

        <PremiumCard>
          <div style={T.metricLabel}>Gray Zones</div>
          <GrayZones data={session.gray_zones} />
        </PremiumCard>

        <PremiumCard>
          <div style={T.metricLabel}>Code-Switching</div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 72, fontWeight: 800, color: T.ink, lineHeight: 1, letterSpacing: '-0.04em' }}>
              <CountUp value={switchCount} delay={0} />
            </div>
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
                  "{inst}"
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

        <button onClick={onBack} style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
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

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
          {sessions.map((s, i) => (
            <button key={i} onClick={() => setActiveSession(i)} style={{
              padding: '4px 12px', borderRadius: 4, fontSize: 11, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              ...(activeSession === i
                ? { background: T.ink, color: '#FFFFFF', fontWeight: 700 }
                : { background: 'rgba(0,0,0,0.05)', color: T.gray })
            }}>
              {s.label}
            </button>
          ))}
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

function SessionView({ session, progression }: {
  session: Session
  progression: NonNullable<AnalysisResult['progression']> | null
}) {
  return (
    <div>
      <RevealRow delay={0}>
        <NewWordsHero session={session} />
      </RevealRow>
      <RevealRow delay={0.1}>
        <OverviewSection session={session} progression={progression} />
      </RevealRow>
      <RevealRow delay={0.15}>
        <CommunicationSection session={session} />
      </RevealRow>
      <RevealRow delay={0.2}>
        <PatternsSection session={session} />
      </RevealRow>
      <RevealRow delay={0.25}>
        <VocabularySection session={session} />
      </RevealRow>
      <RevealRow delay={0.3}>
        <DiagnosticSection session={session} />
      </RevealRow>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function DashboardInner({ data, onBack }: { data: AnalysisResult; onBack: () => void }) {
  const [activeSession, setActiveSession] = useState(0)
  const sessions = data.sessions ?? []

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F6' }}>
      <StickyHeader data={data} sessions={sessions} activeSession={activeSession} setActiveSession={setActiveSession} onBack={onBack} />

      {/* System headline — plays once on mount, never loops */}
      <div style={{ textAlign: 'center', padding: '36px 32px 28px' }}>
        <EncryptedText
          text="Decoding session signals"
          startDelayMs={500}
          revealDelayMs={95}
          scrambleSpeed={38}
          style={{
            fontSize: 44,
            fontWeight: 600,
            letterSpacing: '0.05em',
          }}
          encryptedStyle={{ color: '#9CA3AF' }}
          revealedStyle={{ color: '#1F2937' }}
        />
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px 80px' }}>
        <AnimatePresence mode="wait">
          {sessions[activeSession] ? (
            <motion.div key={activeSession} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <SessionView session={sessions[activeSession]} progression={data.progression} />
            </motion.div>
          ) : (
            <p style={{ fontSize: 13, color: T.muted, padding: '48px 0' }}>No session data available.</p>
          )}
        </AnimatePresence>
      </div>
      <MetricTooltip />
    </div>
  )
}

export default function Dashboard({ data, onBack }: { data: AnalysisResult; onBack: () => void }) {
  return <ErrorBoundary><DashboardInner data={data} onBack={onBack} /></ErrorBoundary>
}
