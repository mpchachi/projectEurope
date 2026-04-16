import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchConversations, fetchPreset } from './api'
import Dashboard from './components/Dashboard'
import type { AnalysisResult, ConversationCard } from './types'
import './index.css'

type Screen = 'home' | 'import' | 'live' | 'dashboard'

const BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  PROGRESSION: { bg: 'rgba(52,211,153,0.12)',  color: '#059669' },
  PLATEAU:     { bg: 'rgba(251,191,36,0.15)',   color: '#D97706' },
  'CEFR DEMO': { bg: 'rgba(139,92,246,0.1)',    color: '#7C3AED' },
  LIVE:        { bg: 'rgba(59,130,246,0.1)',    color: '#2563EB' },
}

// ─── Home ─────────────────────────────────────────────────────────────────────

function HomeScreen({ onImport, onLive }: { onImport: () => void; onLive: () => void }) {
  return (
    <div className="min-h-screen bg-[#F3F3F4] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#FE79AB] flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-[#121114] text-xl font-bold tracking-tight">Language Coach</span>
        </div>
        <p className="text-[#6F6F78] text-sm">12-metric post-session analytics · Deepgram + Claude</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        <motion.button
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onImport}
          className="rounded-2xl bg-white border border-[#D9D9DE] p-6 text-left cursor-pointer transition-all group"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors"
            style={{ background: 'rgba(254,121,171,0.1)' }}>
            <svg className="w-5 h-5 text-[#FE79AB]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h2 className="text-[#121114] font-semibold text-base mb-1">Import Conversation</h2>
          <p className="text-[#6F6F78] text-xs leading-relaxed">Analyze pre-recorded sessions and track student progression over time</p>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLive}
          className="rounded-2xl bg-white border border-[#D9D9DE] p-6 text-left cursor-pointer transition-all group"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors"
            style={{ background: 'rgba(95,199,194,0.1)' }}>
            <svg className="w-5 h-5 text-[#5FC7C2]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx={12} cy={12} r={3} fill="currentColor" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
            </svg>
          </div>
          <h2 className="text-[#121114] font-semibold text-base mb-1">Live Demo</h2>
          <p className="text-[#6F6F78] text-xs leading-relaxed">Record a session in real-time and get instant analysis when it ends</p>
        </motion.button>
      </div>
    </div>
  )
}

// ─── Import ───────────────────────────────────────────────────────────────────

function ImportScreen({ onBack, onSelect }: { onBack: () => void; onSelect: (data: AnalysisResult) => void }) {
  const [cards, setCards]   = useState<ConversationCard[] | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    fetchConversations().then(setCards).catch(() => setError('Could not load conversations'))
  }, [])

  async function handleSelect(id: string) {
    setLoading(id); setError(null)
    try {
      onSelect(await fetchPreset(id))
    } catch {
      setError('Analysis failed — is the backend running?')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F3F4] px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="text-[#6F6F78] hover:text-[#121114] text-sm mb-8 flex items-center gap-1 transition-colors">
          ← Back
        </button>

        <h1 className="text-[#121114] text-2xl font-bold mb-1">Import Conversation</h1>
        <p className="text-[#6F6F78] text-sm mb-8">Select a session to analyze</p>

        {error && (
          <div className="rounded-xl p-4 text-sm mb-6"
            style={{ background: 'rgba(239,68,68,0.07)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.15)' }}>
            {error}
          </div>
        )}

        {!cards ? (
          <div className="flex items-center justify-center h-48 text-[#6F6F78]">Loading…</div>
        ) : (
          <div className="flex flex-col gap-3">
            {cards.map((c, i) => {
              const bs = BADGE_STYLE[c.badge] ?? BADGE_STYLE.PROGRESSION
              const isLoading = loading === c.id
              return (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelect(c.id)}
                  disabled={!!loading}
                  className="text-left rounded-2xl bg-white border border-[#D9D9DE] p-5 cursor-pointer transition-all duration-200 disabled:opacity-60"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#121114] font-semibold text-sm">{c.name}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-md font-medium"
                          style={{ background: bs.bg, color: bs.color }}>
                          {c.badge}
                        </span>
                      </div>
                      <p className="text-[#6F6F78] text-xs">{c.description}</p>
                      <p className="text-[#6F6F78] text-xs mt-1">{c.sessions} sessions</p>
                    </div>
                    <div className="shrink-0 text-[#6F6F78] text-sm mt-1">
                      {isLoading
                        ? <span className="animate-spin inline-block w-4 h-4 border-2 border-[#FE79AB] border-t-transparent rounded-full" />
                        : '→'}
                    </div>
                  </div>
                  {isLoading && (
                    <div className="mt-3 text-xs text-[#FE79AB] animate-pulse">Analyzing… this takes ~20s</div>
                  )}
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
    <div className="min-h-screen bg-[#F3F3F4] px-6 py-8">
      <div className="max-w-md mx-auto">
        <button onClick={onBack} className="text-[#6F6F78] hover:text-[#121114] text-sm mb-8 flex items-center gap-1 transition-colors">
          ← Back
        </button>

        <h1 className="text-[#121114] text-2xl font-bold mb-1">Live Demo</h1>
        <p className="text-[#6F6F78] text-sm mb-10">Record a session and get instant analysis</p>

        <div className="flex flex-col gap-3 mb-10">
          {STEPS.map((s, i) => (
            <motion.div
              key={s}
              className="flex items-center gap-4 p-4 rounded-xl border transition-all duration-200"
              style={i < step
                ? { background: 'rgba(52,211,153,0.07)', borderColor: 'rgba(52,211,153,0.3)' }
                : i === step
                ? { background: 'rgba(254,121,171,0.07)', borderColor: 'rgba(254,121,171,0.3)' }
                : { background: '#FFFFFF', borderColor: '#D9D9DE' }
              }
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={i < step
                  ? { background: '#34D399', color: '#FFFFFF' }
                  : i === step
                  ? { border: '2px solid #FE79AB', color: '#FE79AB' }
                  : { border: '1px solid #D9D9DE', color: '#6F6F78' }
                }
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span className="text-sm font-medium" style={{ color: i <= step ? '#121114' : '#6F6F78' }}>{s}</span>
              {i === step && (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="ml-auto text-xs text-[#FE79AB]"
                >●</motion.span>
              )}
            </motion.div>
          ))}
        </div>

        <button
          onClick={() => setStep(s => Math.min(s + 1, STEPS.length - 1))}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all active:scale-95"
          style={{ background: '#FE79AB' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#e06898')}
          onMouseLeave={e => (e.currentTarget.style.background = '#FE79AB')}
        >
          {step === 0 ? 'Start Recording' : step === STEPS.length - 1 ? 'View Results' : 'Next step (demo)'}
        </button>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [result, setResult] = useState<AnalysisResult | null>(null)

  function showDashboard(data: AnalysisResult) { setResult(data); setScreen('dashboard') }

  const pageKey = screen === 'dashboard' ? 'dashboard' : screen

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pageKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        style={{ minHeight: '100vh' }}
      >
        {screen === 'home' && (
          <HomeScreen onImport={() => setScreen('import')} onLive={() => setScreen('live')} />
        )}
        {screen === 'import' && (
          <ImportScreen onBack={() => setScreen('home')} onSelect={showDashboard} />
        )}
        {screen === 'live' && (
          <LiveScreen onBack={() => setScreen('home')} />
        )}
        {screen === 'dashboard' && result && (
          <Dashboard data={result} onBack={() => setScreen('import')} />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
