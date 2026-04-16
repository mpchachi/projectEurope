import { useState, useEffect, useRef } from 'react'
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

const PROCESS_STEPS = [
  { label: 'Uploading audio…',          until: 4  },
  { label: 'Transcribing with Deepgram…', until: 55 },
  { label: 'Analyzing with Claude…',    until: 90 },
  { label: 'Building your dashboard…',  until: Infinity },
]

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function LiveScreen({ onBack, onSelect }: {
  onBack: () => void
  onSelect: (data: AnalysisResult) => void
}) {
  const [studentId, setStudentId]     = useState(() => localStorage.getItem('lc_student_id') || '')
  const [phase, setPhase]             = useState<'setup' | 'recording' | 'processing' | 'error'>('setup')
  const [elapsed, setElapsed]         = useState(0)
  const [procElapsed, setProcElapsed] = useState(0)
  const [error, setError]             = useState<string | null>(null)

  const mediaRef  = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const procRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => {
    clearInterval(timerRef.current!)
    clearInterval(procRef.current!)
  }, [])

  async function startRecording() {
    const sid = studentId.trim()
    if (!sid) return
    localStorage.setItem('lc_student_id', sid)
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.start(500)
      mediaRef.current = recorder
      setElapsed(0)
      setPhase('recording')
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    } catch {
      setError('Microphone access denied. Allow microphone access and try again.')
    }
  }

  async function stopAndAnalyze() {
    const recorder = mediaRef.current
    if (!recorder) return
    clearInterval(timerRef.current!)
    recorder.stream.getTracks().forEach(t => t.stop())

    await new Promise<void>(resolve => { recorder.onstop = () => resolve(); recorder.stop() })

    setPhase('processing')
    setProcElapsed(0)
    procRef.current = setInterval(() => setProcElapsed(s => s + 1), 1000)

    try {
      const mimeType = recorder.mimeType || 'audio/webm'
      const blob = new Blob(chunksRef.current, { type: mimeType })
      const ext  = mimeType.includes('ogg') ? 'ogg' : 'webm'

      const form = new FormData()
      form.append('audio', blob, `recording.${ext}`)
      form.append('student_id', studentId.trim())
      form.append('label', `Session ${new Date().toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}`)

      const res = await fetch('/api/live/upload', { method: 'POST', body: form })
      if (!res.ok) {
        const msg = await res.text().catch(() => `HTTP ${res.status}`)
        throw new Error(msg)
      }
      clearInterval(procRef.current!)
      onSelect(await res.json())
    } catch (e: unknown) {
      clearInterval(procRef.current!)
      setError(e instanceof Error ? e.message : 'Analysis failed. Is the backend running?')
      setPhase('error')
    }
  }

  const procStep = PROCESS_STEPS.findIndex(s => procElapsed < s.until)

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F6', padding: '40px' }}>
      <div style={{ maxWidth: 440, margin: '0 auto' }}>

        <button onClick={onBack}
          style={{ fontSize: 12, color: S.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 40, display: 'flex', alignItems: 'center', gap: 4 }}
          onMouseEnter={e => (e.currentTarget.style.color = S.ink)}
          onMouseLeave={e => (e.currentTarget.style.color = S.muted)}>
          ← Back
        </button>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: S.ink, letterSpacing: '-0.03em', marginBottom: 6 }}>Live Recording</h1>
        <p style={{ fontSize: 13, color: S.muted, marginBottom: 36 }}>
          Record a session · results saved under your name · compare across sessions
        </p>

        {/* ── Setup ── */}
        {phase === 'setup' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
              Student name / ID
            </label>
            <input
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && studentId.trim() && startRecording()}
              placeholder="e.g. maria-garcia"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '11px 14px', borderRadius: 8,
                border: '1px solid #EBEBEB', fontSize: 14,
                outline: 'none', marginBottom: 20,
                background: '#FFFFFF', color: S.ink,
              }}
              autoFocus
            />
            <p style={{ fontSize: 12, color: S.muted, marginBottom: 24, lineHeight: 1.5 }}>
              Every recording you make will be saved under this name so you can track progression across sessions.
            </p>
            <button
              onClick={startRecording}
              disabled={!studentId.trim()}
              style={{
                width: '100%', padding: '13px', borderRadius: 8,
                fontWeight: 700, fontSize: 14, color: '#FFFFFF',
                background: studentId.trim() ? '#FF4D7E' : '#D1D5DB',
                border: 'none', cursor: studentId.trim() ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
            >
              Start Recording
            </button>
          </motion.div>
        )}

        {/* ── Recording ── */}
        {phase === 'recording' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>

            {/* Pulsing indicator */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.05, 0.15] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                style={{ position: 'absolute', width: 96, height: 96, borderRadius: '50%', background: '#FF4D7E' }} />
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FF4D7E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" fill="white" viewBox="0 0 24 24">
                  <rect x="9" y="2" width="6" height="13" rx="3" />
                  <path d="M5 10a7 7 0 0014 0" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <line x1="12" y1="19" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: S.ink, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(elapsed)}
              </div>
              <div style={{ fontSize: 12, color: S.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Recording · {studentId}
              </div>
            </div>

            <button
              onClick={stopAndAnalyze}
              style={{
                width: '100%', padding: '13px', borderRadius: 8,
                fontWeight: 700, fontSize: 14, color: '#FFFFFF',
                background: S.ink, border: 'none', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#374151')}
              onMouseLeave={e => (e.currentTarget.style.background = S.ink)}
            >
              Stop &amp; Analyze
            </button>
          </motion.div>
        )}

        {/* ── Processing ── */}
        {phase === 'processing' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ border: '1px solid #EBEBEB', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
              {PROCESS_STEPS.map((s, i) => {
                const done    = i < procStep
                const active  = i === procStep
                return (
                  <div key={s.label} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                    borderBottom: i < PROCESS_STEPS.length - 1 ? '1px solid #F3F4F6' : 'none',
                    background: active ? '#FAFAFA' : '#FFFFFF',
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, flexShrink: 0,
                      ...(done
                        ? { background: S.ink, color: '#FFFFFF' }
                        : active
                        ? { border: '1.5px solid #FF4D7E', color: '#FF4D7E' }
                        : { border: '1px solid #E5E7EB', color: '#D1D5DB' })
                    }}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: done || active ? 600 : 400, color: done || active ? S.ink : S.muted, flex: 1 }}>
                      {s.label}
                    </span>
                    {active && (
                      <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.4 }}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF4D7E', flexShrink: 0 }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 12, color: S.muted, textAlign: 'center' }}>
              {fmt(procElapsed)} elapsed · usually 60–90 s total
            </p>
          </motion.div>
        )}

        {/* ── Error ── */}
        {phase === 'error' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ borderRadius: 8, padding: '14px 16px', marginBottom: 20, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', color: '#DC2626', fontSize: 13, lineHeight: 1.5 }}>
              {error}
            </div>
            <button
              onClick={() => { setError(null); setPhase('setup') }}
              style={{ width: '100%', padding: '12px', borderRadius: 8, fontWeight: 700, fontSize: 13, color: '#FFFFFF', background: S.ink, border: 'none', cursor: 'pointer' }}
            >
              Try again
            </button>
          </motion.div>
        )}

      </div>
    </div>
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
        {screen === 'live'      && <LiveScreen    onBack={() => setScreen('home')} onSelect={showDashboard} />}
        {screen === 'dashboard' && result && <Dashboard data={result} onBack={() => setScreen('import')} />}
      </motion.div>
    </AnimatePresence>
  )
}
