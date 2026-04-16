import { useState, useEffect } from 'react'
import { motion, animate, useMotionValue } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CEFRProgressCardProps {
  level?: string
  confidence?: 'high' | 'medium' | 'low'
  description?: string
  positiveSignals?: string[]
  negativeSignals?: string[]
  sessionSummary?: string
  progressionStatus?: 'progressing' | 'plateauing' | 'declining'
  nextFocus?: string
  signalsScore?: number
  signalsTotal?: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const CONFIDENCE_STYLES = {
  high:   { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  medium: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  low:    { bg: '#fff1f2', color: '#e11d48', border: '#fecdd3' },
}

const STATUS_COLORS = {
  progressing: '#22c55e',
  plateauing:  '#f59e0b',
  declining:   '#ef4444',
}

const STATUS_MESSAGES = {
  progressing: 'Clear progression detected.',
  plateauing:  'Performance has plateaued.',
  declining:   'Some regression observed.',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CEFRProgressCard({
  level            = 'A2',
  confidence       = 'medium',
  description      = '',
  positiveSignals  = [],
  negativeSignals  = [],
  sessionSummary   = '',
  progressionStatus = 'progressing',
  nextFocus        = '',
  signalsScore     = 0,
  signalsTotal     = 0,
}: CEFRProgressCardProps) {
  const [expanded,     setExpanded]     = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)

  const levelIndex      = Math.max(0, LEVELS.indexOf(level))
  const progressPercent = ((levelIndex + 0.5) / LEVELS.length) * 100
  const progressWidth   = useMotionValue(0)
  const [barWidth, setBarWidth] = useState(0)

  useEffect(() => {
    const ctrl = animate(progressWidth, progressPercent, {
      duration: 1.2,
      ease:     [0.33, 1, 0.68, 1],
      delay:    0.55,
    })
    return () => ctrl.stop()
  }, [progressPercent])

  useEffect(() => {
    const unsub = progressWidth.on('change', v => setBarWidth(v))
    return unsub
  }, [])

  const cStyle = CONFIDENCE_STYLES[confidence] ?? CONFIDENCE_STYLES.medium
  const sColor = STATUS_COLORS[progressionStatus]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1px 1fr',
      gap: '0 40px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;900&display=swap');`}</style>

      {/* ── Left: CEFR level ──────────────────────────────── */}
      <div>
        <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
          CEFR LEVEL
        </div>

        {/* Giant animated level text */}
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 96, fontWeight: 900, color: '#0a0a0a', lineHeight: 1 }}>
          {level.split('').map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: 'easeOut' }}
            >
              {char}
            </motion.span>
          ))}
        </div>

        {/* Confidence badge */}
        <div style={{
          display: 'inline-block',
          background: cStyle.bg, color: cStyle.color, border: `1px solid ${cStyle.border}`,
          borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 600, marginTop: 12,
        }}>
          ● {confidence} confidence
        </div>

        {/* Description */}
        {description && (
          <div style={{ marginTop: 16 }}>
            <p style={{
              fontSize: 13, color: '#555', lineHeight: 1.7, margin: 0,
              display:           !descExpanded ? '-webkit-box' : undefined,
              WebkitLineClamp:   !descExpanded ? 4 : undefined,
              WebkitBoxOrient:   !descExpanded ? 'vertical' : undefined,
              overflow:          !descExpanded ? 'hidden' : undefined,
            }}>
              {description}
            </p>
            {description.length > 160 && (
              <button
                onClick={() => setDescExpanded(d => !d)}
                style={{ background: 'none', border: 'none', color: '#FF4785', fontSize: 12, cursor: 'pointer', marginTop: 4, padding: 0 }}
              >
                {descExpanded ? 'Collapse ↑' : 'Read more ↓'}
              </button>
            )}
          </div>
        )}

        {/* CEFR journey progress bar */}
        <div style={{ marginTop: 28 }}>
          <div style={{ position: 'relative', height: 6, background: '#f0f0f0', borderRadius: 3, marginBottom: 20 }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              background: '#FF4785', borderRadius: 3,
              width: `${barWidth}%`,
            }} />
          </div>
          <div style={{ display: 'flex' }}>
            {LEVELS.map((l, i) => {
              const isActive = l === level
              const isPast   = i < levelIndex
              return (
                <div key={l} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                  {isActive && (
                    <div style={{
                      position: 'absolute', bottom: '100%', left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: 9, color: '#FF4785', whiteSpace: 'nowrap',
                      fontWeight: 700, marginBottom: 4,
                    }}>
                      ↑ here
                    </div>
                  )}
                  <div style={{
                    width:        isActive ? 10 : 6,
                    height:       isActive ? 10 : 6,
                    borderRadius: '50%',
                    margin:       '0 auto 4px',
                    background:   isActive ? '#FF4785' : isPast ? '#FF4785' : '#e0e0e0',
                    boxShadow:    isActive ? '0 0 0 3px rgba(255,71,133,0.2)' : undefined,
                  }} />
                  <div style={{
                    fontSize:   10,
                    fontWeight: isActive ? 700 : 400,
                    color:      isActive ? '#0a0a0a' : isPast ? '#9CA3AF' : '#ccc',
                    letterSpacing: '0.04em',
                  }}>
                    {l}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Vertical divider ──────────────────────────────── */}
      <div style={{ background: '#EBEBEB' }} />

      {/* ── Right: Insight + Signals + Summary ───────────── */}
      <div>
        <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>
          SESSION INSIGHT
        </div>

        {/* Progression status */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: sColor }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: sColor, textTransform: 'capitalize' }}>
              {progressionStatus}
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, margin: 0 }}>
            {STATUS_MESSAGES[progressionStatus]}
          </p>
          {nextFocus && (
            <p style={{ fontSize: 12, color: '#888', marginTop: 4, marginBottom: 0 }}>
              Next focus: {nextFocus}
            </p>
          )}
        </div>

        {/* Progression signals */}
        {signalsTotal > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Signals
              </span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#0a0a0a' }}>
                {signalsScore}
              </span>
              <span style={{ fontSize: 14, color: '#bbb' }}>/{signalsTotal}</span>
            </div>

            {positiveSignals.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  POSITIVE
                </div>
                {positiveSignals.map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#059669', marginBottom: 3 }}>✓ {s}</div>
                ))}
              </div>
            )}
            {negativeSignals.length > 0 && (
              <div style={{ marginTop: positiveSignals.length ? 8 : 0 }}>
                {negativeSignals.map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#ef4444', marginBottom: 3 }}>✗ {s}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Session summary */}
        {sessionSummary && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              SESSION SUMMARY
            </div>
            <div style={{ overflow: 'hidden', maxHeight: expanded ? 600 : 80, transition: 'max-height 0.3s ease' }}>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, margin: 0 }}>
                {sessionSummary}
              </p>
            </div>
            <button
              onClick={() => setExpanded(e => !e)}
              style={{ background: 'none', border: 'none', color: '#FF4785', fontSize: 12, cursor: 'pointer', marginTop: 4, padding: 0 }}
            >
              {expanded ? 'Collapse ↑' : 'Expand ↓'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
