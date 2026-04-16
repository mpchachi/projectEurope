import { motion } from 'framer-motion'
import type { Progression } from '../types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface TimelineProps {
  progression: Progression
  activeSession: number
  onSelectSession: (i: number) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Timeline({ progression, activeSession, onSelectSession }: TimelineProps) {
  const labels = progression.labels ?? []
  const cefr   = progression.metrics_table?.cefr ?? progression.cefr_journey ?? []
  const talk   = progression.metrics_table?.talk_time_pct ?? []
  const n      = labels.length

  if (n < 2) return null

  // Width of filled connecting line as % of the total track
  const fillPct = n > 1 ? (activeSession / (n - 1)) * 100 : 0

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 16,
      border: '1px solid #EBEBEB',
      padding: '20px 24px 18px',
      marginBottom: 16,
      overflowX: 'auto',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: '#BCBCBC',
        textTransform: 'uppercase', letterSpacing: '0.11em',
        marginBottom: 16,
      }}>
        Session History
      </div>

      <div style={{ position: 'relative', minWidth: n * 88 }}>

        {/* Track line */}
        <div style={{
          position: 'absolute',
          top: 20,
          left: `${50 / n}%`,
          right: `${50 / n}%`,
          height: 2,
          background: '#F0F0F0',
          borderRadius: 2,
        }}>
          <motion.div
            style={{ height: '100%', background: '#FF4785', borderRadius: 2, transformOrigin: 'left' }}
            initial={{ width: '0%' }}
            animate={{ width: `${fillPct}%` }}
            transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
          />
        </div>

        {/* Session nodes */}
        <div style={{ display: 'flex' }}>
          {labels.map((label, i) => {
            const isActive = i === activeSession
            const isPast   = i < activeSession
            const level    = cefr[i] ?? '—'
            const talkPct  = talk[i] != null ? Math.round(talk[i]) : null

            // Short label: "Session 3" → "S3"
            const shortLabel = label.replace(/session\s*/i, 'S')

            return (
              <motion.div
                key={i}
                onClick={() => onSelectSession(i)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25, ease: 'easeOut' }}
                style={{
                  flex:           1,
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  cursor:         'pointer',
                  gap:            5,
                  paddingTop:     0,
                  userSelect:     'none',
                }}
              >
                {/* Dot */}
                <div style={{
                  width:        isActive ? 14 : 8,
                  height:       isActive ? 14 : 8,
                  borderRadius: '50%',
                  background:   isActive ? '#FF4785' : isPast ? '#FF4785' : '#E5E7EB',
                  border:       isActive ? '2px solid white' : '2px solid white',
                  boxShadow:    isActive
                    ? '0 0 0 3px rgba(255,71,133,0.2), 0 0 12px rgba(255,71,133,0.25)'
                    : undefined,
                  position:    'relative',
                  zIndex:      1,
                  flexShrink:  0,
                  transition:  'all 0.2s ease',
                  marginBottom: 6,
                }} />

                {/* CEFR level */}
                <div style={{
                  fontSize:   11,
                  fontWeight: isActive ? 700 : 500,
                  color:      isActive ? '#FF4785' : isPast ? '#6B7280' : '#D1D5DB',
                  letterSpacing: '0.04em',
                }}>
                  {level}
                </div>

                {/* Session label */}
                <div style={{
                  fontSize:   10,
                  color:      isActive ? '#111' : '#9CA3AF',
                  fontWeight: isActive ? 600 : 400,
                  whiteSpace: 'nowrap',
                }}>
                  {shortLabel}
                </div>

                {/* Talk ratio */}
                {talkPct != null && (
                  <div style={{
                    fontSize:   10,
                    color:      isActive ? '#FF4785' : isPast ? '#D1D5DB' : '#E5E7EB',
                    fontWeight: isActive ? 600 : 400,
                  }}>
                    {talkPct}%
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
