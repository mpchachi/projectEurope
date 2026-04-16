import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchConversations, fetchPreset } from './api'
import Dashboard from './components/Dashboard'
import type { AnalysisResult, ConversationCard } from './types'
import './index.css'

type Screen = 'home' | 'import' | 'live' | 'dashboard'

const BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  PROGRESSION: { bg: 'rgba(5,150,105,0.08)',  color: '#059669' },
  PLATEAU:     { bg: 'rgba(251,191,36,0.10)', color: '#B45309' },
  'CEFR DEMO': { bg: 'rgba(99,102,241,0.08)', color: '#4F46E5' },
  LIVE:        { bg: 'rgba(55,65,81,0.08)',   color: '#374151' },
}

const S = {
  ink:   '#111111',
  gray:  '#6B7280',
  muted: '#9CA3AF',
  border:'#EBEBEB',
}

// ─── Home ─────────────────────────────────────────────────────────────────────

function HomeScreen({ onImport, onLive }: { onImport: () => void; onLive: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 40, textAlign: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: S.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, color: S.ink, letterSpacing: '-0.02em' }}>Language Coach</span>
        </div>
        <p style={{ fontSize: 12, color: S.muted, letterSpacing: '0.04em' }}>
          12-metric post-session analytics · Deepgram + Claude
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', maxWidth: 560 }}>
        {[
          {
            label: 'Import Conversation',
            desc: 'Analyze pre-recorded sessions and track progression over time',
            onClick: onImport,
          },
          {
            label: 'Live Demo',
            desc: 'Record a session in real-time and get instant analysis when it ends',
            onClick: onLive,
          },
        ].map((item, i) => (
          <motion.button
            key={item.label}
            className="card-premium"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={item.onClick}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            style={{ textAlign: 'left', border: 'none', cursor: 'pointer' }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: S.ink, marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 12, color: S.muted, lineHeight: 1.5 }}>{item.desc}</div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ─── Import ───────────────────────────────────────────────────────────────────

function ImportScreen({ onBack, onSelect }: { onBack: () => void; onSelect: (data: AnalysisResult) => void }) {
  const [cards, setCards]     = useState<ConversationCard[] | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetchConversations().then(setCards).catch(() => setError('Could not load conversations'))
  }, [])

  async function handleSelect(id: string) {
    setLoading(id); setError(null)
    try { onSelect(await fetchPreset(id)) }
    catch { setError('Analysis failed — is the backend running?'); setLoading(null) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F6', padding: '40px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <button
          onClick={onBack}
          style={{ fontSize: 12, color: S.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 40, display: 'flex', alignItems: 'center', gap: 4 }}
          onMouseEnter={e => (e.currentTarget.style.color = S.ink)}
          onMouseLeave={e => (e.currentTarget.style.color = S.muted)}
        >
          ← Back
        </button>

        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: S.ink, letterSpacing: '-0.03em', marginBottom: 6 }}>
            Import Conversation
          </h1>
          <p style={{ fontSize: 13, color: S.muted }}>Select a session to analyze</p>
        </div>

        {error && (
          <div style={{ borderRadius: 4, padding: '10px 14px', fontSize: 13, marginBottom: 20, background: 'rgba(239,68,68,0.05)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.12)' }}>
            {error}
          </div>
        )}

        {!cards ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: S.muted, fontSize: 13 }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cards.map((c, i) => {
              const bs = BADGE_STYLE[c.badge] ?? BADGE_STYLE.PROGRESSION
              const isLoading = loading === c.id
              return (
                <motion.button
                  key={c.id}
                  className="card-premium"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => handleSelect(c.id)}
                  disabled={!!loading}
                  style={{
                    width: '100%', textAlign: 'left',
                    cursor: 'pointer',
                    opacity: loading && !isLoading ? 0.4 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

                    {/* Index */}
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: '#D1D5DB',
                      fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em',
                      flexShrink: 0, width: 20,
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: S.ink, letterSpacing: '-0.01em' }}>
                          {c.name}
                        </span>
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 3,
                          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                          background: bs.bg, color: bs.color, flexShrink: 0,
                        }}>
                          {c.badge}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: S.gray, margin: 0, lineHeight: 1.4 }}>{c.description}</p>
                      <p style={{ fontSize: 11, color: S.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                        {c.sessions} sessions
                      </p>
                    </div>

                    {/* Arrow / spinner */}
                    <div style={{ flexShrink: 0, color: S.muted }}>
                      {isLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <span style={{
                            display: 'inline-block', width: 14, height: 14,
                            border: '1.5px solid #D1D5DB', borderTopColor: S.ink,
                            borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                          }} />
                          <span style={{ fontSize: 11, color: S.muted }}>~20s</span>
                        </div>
                      ) : (
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>

                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Live ─────────────────────────────────────────────────────────────────────

const STEPS = ['Recording', 'Transcribing', 'Analyzing', 'Done']

function LiveScreen({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0)

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F6', padding: '40px' }}>
      <div style={{ maxWidth: 440, margin: '0 auto' }}>
        <button
          onClick={onBack}
          style={{ fontSize: 12, color: S.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 40, display: 'flex', alignItems: 'center', gap: 4 }}
          onMouseEnter={e => (e.currentTarget.style.color = S.ink)}
          onMouseLeave={e => (e.currentTarget.style.color = S.muted)}
        >
          ← Back
        </button>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: S.ink, letterSpacing: '-0.03em', marginBottom: 6 }}>Live Demo</h1>
        <p style={{ fontSize: 13, color: S.muted, marginBottom: 36 }}>Record a session and get instant analysis</p>

        <div style={{ border: '1px solid #EBEBEB', borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              borderBottom: i < STEPS.length - 1 ? '1px solid #F3F4F6' : 'none',
              background: i === step ? '#FAFAFA' : '#FFFFFF',
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, flexShrink: 0,
                ...(i < step
                  ? { background: S.ink, color: '#FFFFFF' }
                  : i === step
                  ? { border: '1.5px solid #FF4D7E', color: '#FF4D7E' }
                  : { border: '1px solid #E5E7EB', color: '#D1D5DB' })
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 13, fontWeight: i <= step ? 600 : 400, color: i <= step ? S.ink : S.muted }}>
                {s}
              </span>
              {i === step && (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#FF4D7E', flexShrink: 0 }}
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => setStep(s => Math.min(s + 1, STEPS.length - 1))}
          style={{
            width: '100%', padding: '12px', borderRadius: 4,
            fontWeight: 700, fontSize: 13, color: '#FFFFFF',
            background: S.ink, border: 'none', cursor: 'pointer',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#374151')}
          onMouseLeave={e => (e.currentTarget.style.background = S.ink)}
        >
          {step === 0 ? 'Start Recording' : step === STEPS.length - 1 ? 'View Results' : 'Next step (demo)'}
        </button>
      </div>
    </div>
  )
}

// ─── Noise Overlay ────────────────────────────────────────────────────────────

function NoiseOverlay() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 200px',
        opacity: 0.035,
        mixBlendMode: 'overlay',
      }}
      aria-hidden
    />
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [result, setResult] = useState<AnalysisResult | null>(null)

  function showDashboard(data: AnalysisResult) { setResult(data); setScreen('dashboard') }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={screen === 'dashboard' ? 'dashboard' : screen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        style={{ minHeight: '100vh' }}
      >
        {screen === 'home'      && <HomeScreen   onImport={() => setScreen('import')} onLive={() => setScreen('live')} />}
        {screen === 'import'    && <ImportScreen  onBack={() => setScreen('home')} onSelect={showDashboard} />}
        {screen === 'live'      && <LiveScreen    onBack={() => setScreen('home')} />}
        {screen === 'dashboard' && result && <Dashboard data={result} onBack={() => setScreen('import')} />}
      </motion.div>
      <NoiseOverlay />
    </AnimatePresence>
  )
}
