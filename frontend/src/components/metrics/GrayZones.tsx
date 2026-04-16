import { useState } from 'react'
import { motion } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GrammarZone {
  name: string
  status: 'owned' | 'avoided' | 'emerging'
  sessionsAvoided?: number
  lastUsed?: string
}

interface GrayZonesRadarProps {
  zones?: GrammarZone[]
  studentLevel?: string
}

// ─── Defaults (exported so Dashboard adapter can overlay real data) ───────────

export type { GrammarZone }
export const DEFAULT_ZONES: GrammarZone[] = [
  { name: 'Simple Present',     status: 'owned' },
  { name: 'Present Perfect',    status: 'owned' },
  { name: 'Past Simple',        status: 'owned' },
  { name: 'Relative Clauses',   status: 'emerging', lastUsed: 'today' },
  { name: 'Conditionals',       status: 'avoided',  sessionsAvoided: 3 },
  { name: 'Passive Voice',      status: 'avoided',  sessionsAvoided: 5 },
  { name: 'Reported Speech',    status: 'avoided',  sessionsAvoided: 2 },
  { name: 'Subjunctive',        status: 'avoided',  sessionsAvoided: 4 },
  { name: 'Future Perfect',     status: 'avoided',  sessionsAvoided: 6 },
  { name: 'Past Continuous',    status: 'emerging', lastUsed: 'last session' },
  { name: 'Present Continuous', status: 'owned' },
  { name: 'Modal Verbs',        status: 'owned' },
]

// ─── SVG math ────────────────────────────────────────────────────────────────

const OUTER_R = 160
const INNER_R = 60
const CX      = 200
const CY      = 200
const GAP_DEG = 3
const LABEL_R = 185

function degToRad(d: number) { return (d * Math.PI) / 180 }

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = degToRad(angleDeg - 90)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function sectorPath(
  cx: number, cy: number,
  outerR: number, innerR: number,
  startDeg: number, endDeg: number,
): string {
  const outerStart = polarToXY(cx, cy, outerR, startDeg)
  const outerEnd   = polarToXY(cx, cy, outerR, endDeg)
  const innerStart = polarToXY(cx, cy, innerR, endDeg)
  const innerEnd   = polarToXY(cx, cy, innerR, startDeg)
  const largeArc   = endDeg - startDeg > 180 ? 1 : 0
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ')
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GrayZones({ zones, studentLevel }: GrayZonesRadarProps) {
  const allZones   = zones && zones.length > 0 ? zones : DEFAULT_ZONES
  const n          = allZones.length
  const sectorDeg  = 360 / n
  const ownedCount = allZones.filter(z => z.status === 'owned').length

  const [hovered, setHovered]       = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const mostAvoided = [...allZones]
    .filter(z => z.status === 'avoided' && z.sessionsAvoided != null)
    .sort((a, b) => (b.sessionsAvoided ?? 0) - (a.sessionsAvoided ?? 0))[0]

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPos({
      x: Math.min(Math.max(e.clientX - rect.left + 12, 16), rect.width  - 200),
      y: Math.min(Math.max(e.clientY - rect.top  - 70, 0),  rect.height - 80),
    })
  }

  return (
    <div
      style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHovered(null)}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@700&display=swap');`}</style>

      {/* SVG + tooltip wrapper */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
        <svg
          viewBox="0 0 400 400"
          width="100%"
          style={{ overflow: 'visible', display: 'block' }}
        >
          <defs>
            <radialGradient id="grOwnedGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#FF6BA0" stopOpacity={1} />
              <stop offset="100%" stopColor="#FF4785" stopOpacity={1} />
            </radialGradient>
          </defs>

          {/* Decorative guide rings */}
          <circle cx={CX} cy={CY} r={100} fill="none" stroke="#f5f5f5" strokeWidth={1} />
          <circle cx={CX} cy={CY} r={130} fill="none" stroke="#f5f5f5" strokeWidth={1} />

          {/* Sectors */}
          {allZones.map((zone, i) => {
            const startAngle = i * sectorDeg + GAP_DEG
            const endAngle   = (i + 1) * sectorDeg - GAP_DEG
            const d          = sectorPath(CX, CY, OUTER_R, INNER_R, startAngle, endAngle)
            const isHov      = hovered === i

            let fill: string
            let fillOpacity           = 1
            let stroke: string | undefined
            let strokeWidth           = 0
            let strokeDasharray: string | undefined

            if (zone.status === 'owned') {
              fill = 'url(#grOwnedGlow)'
            } else if (zone.status === 'emerging') {
              fill            = '#FF4785'
              fillOpacity     = 0.35
              stroke          = '#FF4785'
              strokeWidth     = 1.5
              strokeDasharray = '4 3'
            } else {
              fill        = isHov ? 'rgba(255,71,133,0.08)' : 'rgba(0,0,0,0.02)'
              stroke      = '#cccccc'
              strokeWidth = 1
            }

            const motionProps = zone.status === 'owned'
              ? {
                  initial:    { opacity: 0, scale: 0.7 },
                  animate:    { opacity: 1, scale: 1 },
                  transition: { type: 'spring' as const, stiffness: 200, damping: 20, delay: i * 0.05 },
                }
              : {
                  initial:    { opacity: 0 },
                  animate:    { opacity: zone.status === 'emerging' ? 1 : 0.5 },
                  transition: { duration: 0.4, delay: i * 0.05 },
                }

            return (
              <motion.path
                key={i}
                d={d}
                fill={fill}
                fillOpacity={fillOpacity}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                style={{
                  transformOrigin: `${CX}px ${CY}px`,
                  cursor: 'pointer',
                  filter: isHov && zone.status === 'owned' ? 'brightness(1.1)' : undefined,
                }}
                onMouseEnter={() => setHovered(i)}
                {...motionProps}
              />
            )
          })}

          {/* Donut hole */}
          <circle cx={CX} cy={CY} r={INNER_R} fill="white" />
          <text
            x={CX} y={CY - 8}
            textAnchor="middle"
            fontFamily="'Playfair Display', serif"
            fontSize={28} fontWeight={700} fill="#0a0a0a"
          >
            {ownedCount}
          </text>
          <text
            x={CX} y={CY + 14}
            textAnchor="middle"
            fontFamily="'DM Sans', sans-serif"
            fontSize={14} fill="#888"
          >
            /{n}
          </text>
          <text
            x={CX} y={CY + 28}
            textAnchor="middle"
            fontFamily="'DM Sans', sans-serif"
            fontSize={10} fill="#999"
          >
            owned
          </text>

          {/* Labels */}
          {allZones.map((zone, i) => {
            const midAngle  = i * sectorDeg + sectorDeg / 2
            const pos       = polarToXY(CX, CY, LABEL_R, midAngle)
            const truncated = zone.name.length > 12 ? zone.name.slice(0, 11) + '…' : zone.name
            let rotation    = midAngle
            if (midAngle > 90 && midAngle < 270) rotation += 180

            return (
              <text
                key={i}
                x={pos.x} y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="'DM Sans', sans-serif"
                fontSize={9}
                fontWeight={zone.status === 'owned' ? 500 : 400}
                fill={zone.status === 'owned' ? '#0a0a0a' : '#cccccc'}
                transform={`rotate(${rotation}, ${pos.x}, ${pos.y})`}
                style={{ pointerEvents: 'none' }}
              >
                {truncated}
              </text>
            )
          })}
        </svg>

        {/* Hover tooltip */}
        {hovered !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{
              position:    'absolute',
              left:        tooltipPos.x,
              top:         tooltipPos.y,
              background:  '#0a0a0a',
              color:       '#fff',
              borderRadius: 10,
              padding:     '8px 14px',
              pointerEvents: 'none',
              zIndex:      20,
              fontFamily:  "'DM Sans', sans-serif",
              whiteSpace:  'nowrap',
              minWidth:    120,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {allZones[hovered].name}
            </div>
            {allZones[hovered].status === 'owned' && (
              <div style={{ fontSize: 12, color: '#FF4785' }}>✓ Used regularly</div>
            )}
            {allZones[hovered].status === 'avoided' && (
              <div style={{ fontSize: 12, color: '#FF4785' }}>
                ⚠ Avoided for {allZones[hovered].sessionsAvoided ?? '?'} sessions
              </div>
            )}
            {allZones[hovered].status === 'emerging' && (
              <div style={{ fontSize: 12, color: 'rgba(255,71,133,0.8)' }}>
                ↗ Last used: {allZones[hovered].lastUsed}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 16 }}>
        {[
          { label: 'Owned',    bg: '#FF4785',                    border: 'none',                         dash: false },
          { label: 'Emerging', bg: 'rgba(255,71,133,0.35)',      border: '1.5px dashed #FF4785',          dash: true  },
          { label: 'Avoided',  bg: 'rgba(0,0,0,0.02)',          border: '1px solid #ccc',                dash: false },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555', fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ width: 12, height: 12, background: item.bg, border: item.border, borderRadius: 2 }} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Most avoided callout */}
      {mostAvoided && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#999', fontFamily: "'DM Sans', sans-serif", textAlign: 'center' }}>
          Longest avoided:{' '}
          <span style={{ color: '#FF4785', fontWeight: 700 }}>{mostAvoided.name}</span>
          {' — '}{mostAvoided.sessionsAvoided} sessions
        </div>
      )}

      {studentLevel && (
        <div style={{ marginTop: 6, fontSize: 11, color: '#ccc', fontFamily: "'DM Sans', sans-serif" }}>
          {studentLevel}
        </div>
      )}
    </div>
  )
}
