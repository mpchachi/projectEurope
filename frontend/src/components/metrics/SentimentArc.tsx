import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// ─── Props ────────────────────────────────────────────────────────────────────

interface SentimentArcProps {
  data: { minute: number; confidence: number }[]
  peakMinute: number
  peakLabel: string
  dipMinute: number
  dipLabel: string
  totalMinutes: number
}

const DEFAULT_DATA: SentimentArcProps = {
  data: [
    { minute: 0,  confidence: 0.35 },
    { minute: 2,  confidence: 0.38 },
    { minute: 4,  confidence: 0.42 },
    { minute: 6,  confidence: 0.39 },
    { minute: 8,  confidence: 0.28 },
    { minute: 10, confidence: 0.45 },
    { minute: 12, confidence: 0.55 },
    { minute: 14, confidence: 0.62 },
    { minute: 16, confidence: 0.70 },
    { minute: 18, confidence: 0.78 },
    { minute: 20, confidence: 0.88 },
    { minute: 22, confidence: 0.82 },
    { minute: 24, confidence: 0.75 },
    { minute: 25, confidence: 0.72 },
  ],
  peakMinute: 20,
  peakLabel: 'Found your rhythm',
  dipMinute: 8,
  dipLabel: 'Tried new grammar',
  totalMinutes: 25,
}

// ─── SVG helpers ──────────────────────────────────────────────────────────────

const SVG_HEIGHT = 220
const PAD_TOP    = 36
const PAD_BOTTOM = 32
const PAD_LEFT   = 32
const PAD_RIGHT  = 32

function toX(minute: number, totalMinutes: number, width: number) {
  return PAD_LEFT + (minute / totalMinutes) * (width - PAD_LEFT - PAD_RIGHT)
}

function toY(confidence: number) {
  return PAD_TOP + (1 - confidence) * (SVG_HEIGHT - PAD_TOP - PAD_BOTTOM)
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  let d = `M${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]
    const tension = 0.3
    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return d
}

function getPointOnPath(
  data: SentimentArcProps['data'],
  minute: number,
  totalMinutes: number,
  width: number,
): { x: number; y: number } {
  const entry = data.find(d => d.minute === minute)
  if (entry) return { x: toX(entry.minute, totalMinutes, width), y: toY(entry.confidence) }
  return { x: toX(minute, totalMinutes, width), y: toY(0.5) }
}

// ─── Component ────────────────────────────────────────────────────────────────

const SentimentArc = (props: Partial<SentimentArcProps>) => {
  const merged = { ...DEFAULT_DATA, ...props }
  const { data, peakMinute, peakLabel, dipMinute, dipLabel, totalMinutes } = merged

  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth]                   = useState(460)
  const [visible, setVisible]               = useState(false)
  const [annotationsVisible, setAnnotationsVisible] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setWidth(e.contentRect.width)
    })
    ro.observe(el)
    setWidth(el.clientWidth || 460)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect() } },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => setAnnotationsVisible(true), 1900)
    return () => clearTimeout(t)
  }, [visible])

  const points  = data.map(d => ({ x: toX(d.minute, totalMinutes, width), y: toY(d.confidence) }))
  const linePath = buildSmoothPath(points)
  const fillPath = linePath
    ? `${linePath} L${points[points.length - 1].x},${SVG_HEIGHT - PAD_BOTTOM} L${points[0].x},${SVG_HEIGHT - PAD_BOTTOM} Z`
    : ''

  const peak = getPointOnPath(data, peakMinute, totalMinutes, width)
  const dip  = getPointOnPath(data, dipMinute,  totalMinutes, width)

  const gradientStops = data.map(d => {
    const pct = (d.minute / totalMinutes) * 100
    const color = d.confidence < 0.45
      ? 'rgba(180,180,200,0.15)'
      : d.confidence <= 0.65
        ? 'rgba(255,71,133,0.12)'
        : 'rgba(255,71,133,0.28)'
    return { pct, color }
  })

  const strokeStops = data.map(d => {
    const pct = (d.minute / totalMinutes) * 100
    const t = Math.min(1, Math.max(0, (d.confidence - 0.28) / (0.88 - 0.28)))
    const r = Math.round(204 + (255 - 204) * t)
    const g = Math.round(204 + (71  - 204) * t)
    const b = Math.round(204 + (133 - 204) * t)
    return { pct, color: `rgb(${r},${g},${b})` }
  })

  const timeLabels = [0, 5, 10, 15, 20, 25].filter(m => m <= totalMinutes)
  const pathLength = 2000

  return (
    <div ref={containerRef}>
      <style>{`
        @keyframes drawArcPath {
          from { stroke-dashoffset: ${pathLength}; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes arcFillIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes arcBreathe {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.9; }
        }
        .arc-line { stroke-dasharray: ${pathLength}; stroke-dashoffset: ${pathLength}; }
        .arc-line.arc-visible { animation: drawArcPath 1.8s ease-out forwards; }
        .arc-fill { opacity: 0; }
        .arc-fill.arc-breathing {
          animation: arcFillIn 2s ease-out 0.3s forwards,
                     arcBreathe 4s ease-in-out 2.3s infinite;
        }
      `}</style>

      <svg
        width="100%"
        height={SVG_HEIGHT}
        viewBox={`0 0 ${width} ${SVG_HEIGHT}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="arcFillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            {gradientStops.map((s, i) => (
              <stop key={i} offset={`${s.pct}%`} stopColor={s.color} />
            ))}
          </linearGradient>
          <linearGradient id="arcStrokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            {strokeStops.map((s, i) => (
              <stop key={i} offset={`${s.pct}%`} stopColor={s.color} />
            ))}
          </linearGradient>
        </defs>

        <path
          d={fillPath}
          fill="url(#arcFillGrad)"
          className={`arc-fill ${visible ? 'arc-breathing' : ''}`}
        />
        <path
          d={linePath}
          fill="none"
          stroke="url(#arcStrokeGrad)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`arc-line ${visible ? 'arc-visible' : ''}`}
        />

        {/* Time labels */}
        {timeLabels.map(m => (
          <text
            key={m}
            x={toX(m, totalMinutes, width)}
            y={SVG_HEIGHT - 6}
            textAnchor="middle"
            fill="#C4C4CC"
            fontSize={9}
          >
            {m === 0 ? '0' : `${m}m`}
          </text>
        ))}

        {/* Peak annotation */}
        {annotationsVisible && (
          <g>
            <motion.line
              x1={peak.x} y1={peak.y} x2={peak.x} y2={PAD_TOP}
              stroke="rgba(255,71,133,0.2)" strokeDasharray="4 4" strokeWidth={1}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
            />
            <motion.circle
              cx={peak.x} cy={peak.y} r={6} fill="#FF4785"
              filter="drop-shadow(0 0 6px rgba(255,71,133,0.6))"
              initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            />
            <motion.text
              x={peak.x} y={PAD_TOP - 8}
              textAnchor="middle" fill="#FF4785" fontSize={10}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
            >
              ↑ {peakLabel}
            </motion.text>
          </g>
        )}

        {/* Dip annotation */}
        {annotationsVisible && (
          <g>
            <motion.circle
              cx={dip.x} cy={dip.y} r={5} fill="rgba(0,0,0,0.18)"
              initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            />
            <motion.text
              x={dip.x} y={dip.y + 20}
              textAnchor="middle" fill="#9CA3AF" fontSize={10}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
            >
              ↓ {dipLabel}
            </motion.text>
          </g>
        )}
      </svg>

      <p style={{
        fontSize: 11, color: '#9CA3AF', fontStyle: 'italic',
        textAlign: 'center', marginTop: 8, marginBottom: 0, letterSpacing: '0.01em',
      }}>
        Peaked at {peakMinute}m — {peakLabel.toLowerCase()}
      </p>
    </div>
  )
}

export default SentimentArc
