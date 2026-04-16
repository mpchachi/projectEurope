import { useState } from 'react'
import { motion } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FillerTopic {
  topic: string
  fillers: number
}

interface FillerPressureWavesProps {
  topics?: FillerTopic[]
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_TOPICS: FillerTopic[] = [
  { topic: 'Relative clauses', fillers: 7 },
  { topic: 'Family vocab',     fillers: 3 },
  { topic: 'Identity',         fillers: 2 },
  { topic: 'Simple present',   fillers: 2 },
]

// ─── Wave helpers ─────────────────────────────────────────────────────────────

const WAVE_COLORS = ['#FF4785', '#2a2a2a', '#888888', '#cccccc']
const DURATIONS   = [3.2, 2.8, 3.6, 2.4]
const PHASES      = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5]

function buildWavePath(width: number, height: number, phase: number, scale: number): string {
  const h          = height * scale
  const peakOffset = h * 0.15
  const baseY      = height
  const topY       = height - h
  const p1y = topY + Math.sin(phase)       * peakOffset
  const p2y = topY + Math.sin(phase + 1.5) * peakOffset
  const p3y = topY + Math.sin(phase + 3)   * peakOffset
  return `M 0 ${baseY} L 0 ${p1y} C ${width * 0.25} ${p2y - peakOffset}, ${width * 0.5} ${p3y + peakOffset}, ${width * 0.75} ${p2y} S ${width} ${p1y - peakOffset * 0.5}, ${width} ${p3y} L ${width} ${baseY} Z`
}

// ─── Component ────────────────────────────────────────────────────────────────

const FillerPressure = ({ topics }: FillerPressureWavesProps) => {
  const rawTopics  = topics && topics.length > 0 ? topics : DEFAULT_TOPICS
  const sorted     = [...rawTopics].sort((a, b) => b.fillers - a.fillers).slice(0, 4)
  const maxFillers = Math.max(...sorted.map(t => t.fillers), 1)
  const [hovered, setHovered] = useState<number | null>(null)

  if (!sorted.length) {
    return <p style={{ fontSize: 13, color: '#9CA3AF' }}>No filler data available</p>
  }

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>

      {/* Waves */}
      <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 8, position: 'relative' }}>
        {sorted.map((t, i) => {
          const waveHeight = Math.max(40, (t.fillers / maxFillers) * 180)
          const color      = WAVE_COLORS[Math.min(i, WAVE_COLORS.length - 1)]
          const gradId     = `waveGrad-${i}`
          const svgW       = 200
          const phase      = PHASES[i % PHASES.length]
          const path1      = buildWavePath(svgW, waveHeight, phase,        1)
          const path2      = buildWavePath(svgW, waveHeight, phase + 1.2,  1.15)
          const path3      = buildWavePath(svgW, waveHeight, phase - 1.2,  0.85)

          return (
            <div
              key={t.topic}
              style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Hover tooltip */}
              {hovered === i && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: 200 - waveHeight - 36,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1a1a1a',
                    color: '#fff',
                    fontSize: 12,
                    padding: '6px 12px',
                    borderRadius: 20,
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                  }}
                >
                  {t.topic}: {t.fillers} filler words
                </motion.div>
              )}

              {/* Wave SVG */}
              <motion.svg
                width="100%"
                height={waveHeight}
                viewBox={`0 0 ${svgW} ${waveHeight}`}
                preserveAspectRatio="none"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: hovered === i ? 1.05 : 1 }}
                transition={{ scaleY: { duration: 0.2 } }}
                style={{ originY: '100%', display: 'block' }}
              >
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={color} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <motion.path
                  fill={`url(#${gradId})`}
                  initial={{ d: buildWavePath(svgW, waveHeight, phase, 0.01) }}
                  animate={{ d: [path1, path2, path3, path1] }}
                  transition={{
                    d: {
                      duration:   DURATIONS[i % DURATIONS.length],
                      repeat:     Infinity,
                      repeatType: 'reverse',
                      ease:       'easeInOut',
                    },
                  }}
                />
              </motion.svg>

              {/* Reveal overlay */}
              <motion.div
                initial={{ height: '100%' }}
                whileInView={{ height: '0%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: '#ffffff', zIndex: 2,
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        {sorted.map((t, i) => {
          const color = WAVE_COLORS[Math.min(i, WAVE_COLORS.length - 1)]
          return (
            <div key={t.topic} style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#0a0a0a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.topic}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color }}>{t.fillers}</div>
              <div style={{ fontSize: 9, color: '#999' }}>fillers</div>
            </div>
          )
        })}
      </div>

      {sorted[0] && (
        <div style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
          Worst topic:{' '}
          <span style={{ color: '#FF4785', fontWeight: 700, textDecoration: 'underline' }}>
            {sorted[0].topic}
          </span>
        </div>
      )}

    </div>
  )
}

export default FillerPressure
