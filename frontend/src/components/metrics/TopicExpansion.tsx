import { useEffect, useState } from 'react'
import { motion, animate, useMotionValue } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopicNode {
  id: string
  label: string
  type: 'known' | 'bridge' | 'expanded'
  strength: number
}

interface TopicConnection {
  from: string
  to: string
  weight: number
}

interface TopicExpansionNetworkCardProps {
  nodes?: TopicNode[]
  connections?: TopicConnection[]
  expansionScore?: number
  newTopicsCount?: number
  dominantDomain?: string
  sessionLabel?: string
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_NODES: TopicNode[] = [
  { id: 'A', label: 'Family vocabulary',   type: 'known',    strength: 0.92 },
  { id: 'B', label: 'Daily routines',      type: 'known',    strength: 0.85 },
  { id: 'C', label: 'Descriptions',        type: 'known',    strength: 0.88 },
  { id: 'D', label: 'Relative clauses',    type: 'bridge',   strength: 0.72 },
  { id: 'E', label: 'Identity statements', type: 'bridge',   strength: 0.65 },
  { id: 'F', label: 'Morphology',          type: 'expanded', strength: 0.52 },
  { id: 'G', label: 'Complex sentences',   type: 'expanded', strength: 0.48 },
  { id: 'H', label: 'Academic vocabulary', type: 'expanded', strength: 0.44 },
  { id: 'I', label: 'Emotional expression',type: 'expanded', strength: 0.58 },
]

const DEFAULT_CONNECTIONS: TopicConnection[] = [
  { from: 'A', to: 'D', weight: 0.90 },
  { from: 'A', to: 'E', weight: 0.80 },
  { from: 'B', to: 'D', weight: 0.75 },
  { from: 'C', to: 'E', weight: 0.85 },
  { from: 'D', to: 'F', weight: 0.70 },
  { from: 'D', to: 'I', weight: 0.65 },
  { from: 'E', to: 'G', weight: 0.60 },
  { from: 'E', to: 'H', weight: 0.55 },
]

// ─── Layout constants ─────────────────────────────────────────────────────────

const NODE_POSITIONS: Record<string, [number, number]> = {
  A: [260, 135],
  B: [186, 263],
  C: [334, 263],
  D: [148, 148],
  E: [372, 148],
  F: [55,  220],
  G: [260, 400],
  H: [465, 220],
  I: [126, 38 ],
}

const NODE_COLORS  = { known: '#FF4785', bridge: '#c084fc', expanded: '#7c3aed' }
const LABEL_COLORS = { known: '#0a0a0a', bridge: '#6b21a8', expanded: '#5b21b6' }
const LABEL_WEIGHTS: Record<TopicNode['type'], number> = { known: 600, bridge: 500, expanded: 400 }

const RINGS = [
  { r: 85,  label: 'KNOWN'    },
  { r: 150, label: 'BRIDGE'   },
  { r: 205, label: 'FRONTIER' },
]

const TYPE_DELAY: Record<TopicNode['type'], number> = { known: 0.3, bridge: 0.65, expanded: 1.0 }

// ─── SVG helpers ─────────────────────────────────────────────────────────────

function truncate(s: string, max = 14) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

function edgePath(x1: number, y1: number, x2: number, y2: number): string {
  const cx = 260, cy = 220
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
  const dx = mx - cx, dy = my - cy
  const dist = Math.sqrt(dx * dx + dy * dy) || 1
  const cpx = mx + (dx / dist) * 30
  const cpy = my + (dy / dist) * 30
  return `M${x1},${y1} Q${cpx},${cpy} ${x2},${y2}`
}


// ─── Component ────────────────────────────────────────────────────────────────

export default function TopicExpansion({
  nodes          = DEFAULT_NODES,
  connections    = DEFAULT_CONNECTIONS,
  expansionScore = 74,
  newTopicsCount = 4,
  dominantDomain = 'Grammatical structure',
  sessionLabel   = 'Session 3 · B1 trajectory',
}: TopicExpansionNetworkCardProps) {
  const scoreMotion = useMotionValue(0)
  const circumference = 2 * Math.PI * 41
  const [scoreDisplay, setScoreDisplay] = useState(0)

  useEffect(() => {
    const ctrl = animate(scoreMotion, expansionScore, {
      duration: 1.2, ease: [0.33, 1, 0.68, 1], delay: 0.5,
    })
    return () => ctrl.stop()
  }, [expansionScore])

  useEffect(() => {
    const unsub = scoreMotion.on('change', v => setScoreDisplay(Math.round(v)))
    return unsub
  }, [])

  const nodeMap      = Object.fromEntries(nodes.map(n => [n.id, n]))
  const knownNodes   = nodes.filter(n => n.type === 'known')
  const bridgeNodes  = nodes.filter(n => n.type === 'bridge')
  const expandedNodes= nodes.filter(n => n.type === 'expanded')

  const avgStrength = (list: TopicNode[]) =>
    list.length ? list.reduce((a, n) => a + n.strength, 0) / list.length : 0

  const bars = [
    { label: 'Known',    color: '#FF4785', avg: avgStrength(knownNodes),    count: knownNodes.length },
    { label: 'Bridge',   color: '#c084fc', avg: avgStrength(bridgeNodes),   count: bridgeNodes.length },
    { label: 'Frontier', color: '#7c3aed', avg: avgStrength(expandedNodes), count: expandedNodes.length },
  ]

  const frontierSorted = [...expandedNodes].sort((a, b) => b.strength - a.strength)

  return (
    <div style={{ display: 'flex', gap: 32, fontFamily: "'DM Sans', sans-serif", alignItems: 'flex-start' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;900&display=swap');`}</style>

      {/* ── LEFT: Network SVG ──────────────────────────────── */}
      <div style={{ flex: '0 0 auto', width: '55%' }}>
        <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>
          TOPIC EXPANSION
        </div>
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>
          {sessionLabel}
        </div>

        <svg viewBox="0 0 520 440" width="100%" style={{ overflow: 'visible', display: 'block' }}>
          <defs>
            {(['known', 'bridge', 'expanded'] as const).map(t => (
              <filter key={t} id={`tpGlow-${t}`} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation={t === 'known' ? 3 : t === 'bridge' ? 2.5 : 2} result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
          </defs>

          {/* Background rings */}
          {RINGS.map((ring, i) => (
            <g key={i}>
              <circle
                cx={260} cy={220} r={ring.r}
                fill="none" stroke="#f0f0f0" strokeWidth={1} strokeDasharray="4 4"
              />
              <text
                x={260 + ring.r - 4} y={220 - 8}
                fill="#d4d4d8" fontSize={8}
                fontFamily="'DM Sans', sans-serif"
                letterSpacing={0.1}
              >
                {ring.label}
              </text>
            </g>
          ))}

          {/* Edges */}
          {connections.map((c, ci) => {
            const p1 = NODE_POSITIONS[c.from]
            const p2 = NODE_POSITIONS[c.to]
            if (!p1 || !p2) return null
            const d        = edgePath(p1[0], p1[1], p2[0], p2[1])
            const dur      = `${((2.5 - c.weight) * 2.5).toFixed(1)}s`
            const halfDur  = `${((2.5 - c.weight) * 2.5 / 2).toFixed(1)}s`
            const sw       = Math.max(0.8, Math.min(1.8, c.weight * 1.8))
            const toNode   = nodeMap[c.to]
            const pColor   = toNode?.type === 'known' ? '#FF4785' : toNode?.type === 'bridge' ? '#c084fc' : '#7c3aed'
            const pR       = toNode?.type === 'known' ? 2.5 : toNode?.type === 'bridge' ? 2.0 : 1.8
            const pOpacity = toNode?.type === 'known' ? 1.0 : toNode?.type === 'bridge' ? 0.85 : 0.7
            const edgeClr  = toNode?.type === 'known'
              ? 'rgba(255,71,133,0.12)'
              : toNode?.type === 'bridge' ? 'rgba(192,132,252,0.10)' : 'rgba(124,58,237,0.08)'

            return (
              <g key={ci}>
                <path d={d} fill="none" stroke={edgeClr} strokeWidth={sw} />
                <circle r={pR} fill={pColor} opacity={pOpacity}>
                  <animateMotion dur={dur} repeatCount="indefinite" path={d} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
                </circle>
                {c.weight > 0.7 && (
                  <circle r={pR * 0.7} fill={pColor} opacity={pOpacity * 0.6}>
                    <animateMotion dur={dur} begin={`-${halfDur}`} repeatCount="indefinite" path={d} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
                  </circle>
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {nodes.map((node, ni) => {
            const pos = NODE_POSITIONS[node.id]
            if (!pos) return null
            const [x, y]  = pos
            const r       = 10 + node.strength * 12
            const color   = NODE_COLORS[node.type]
            const typeIdx = node.type === 'known'
              ? knownNodes.indexOf(node)
              : node.type === 'bridge'
                ? bridgeNodes.indexOf(node)
                : expandedNodes.indexOf(node)

            return (
              <motion.g
                key={ni}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay:    TYPE_DELAY[node.type] + typeIdx * 0.08,
                  duration: 0.4,
                  ease:     'easeOut',
                }}
                style={{ transformOrigin: `${x}px ${y}px` }}
              >
                {/* Aura */}
                <circle cx={x} cy={y} r={r + 7} fill={color} opacity={0.12} />
                {/* Main circle */}
                <circle cx={x} cy={y} r={r} fill={color} filter={`url(#tpGlow-${node.type})`} />
                {/* Center dot for expanded */}
                {node.type === 'expanded' && (
                  <circle cx={x} cy={y} r={3} fill="white" opacity={0.6} />
                )}
                {/* Label */}
                <text
                  x={x} y={y + r + 13}
                  textAnchor="middle"
                  fontFamily="'DM Sans', sans-serif"
                  fontSize={9}
                  fontWeight={LABEL_WEIGHTS[node.type]}
                  fill={LABEL_COLORS[node.type]}
                  style={{ pointerEvents: 'none' }}
                >
                  {truncate(node.label)}
                </text>
              </motion.g>
            )
          })}
        </svg>
      </div>

      {/* ── Divider ─────────────────────────────────────────── */}
      <div style={{ width: 1, background: '#EBEBEB', alignSelf: 'stretch' }} />

      {/* ── RIGHT: Stats panel ──────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          EXPANSION ANALYSIS
        </div>

        {/* Score ring */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width={100} height={100} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
            <circle cx={50} cy={50} r={41} fill="none" stroke="#f0f0f0" strokeWidth={8} />
            <circle
              cx={50} cy={50} r={41}
              fill="none" stroke="#FF4785" strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - scoreDisplay / 100)}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 0.05s linear' }}
            />
            <text x={50} y={46} textAnchor="middle" fontFamily="'Playfair Display', serif" fontSize={22} fontWeight={700} fill="#0a0a0a">
              {scoreDisplay}
            </text>
            <text x={50} y={60} textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize={10} fill="#999">
              score
            </text>
          </svg>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
              EXPANSION SCORE
            </div>
            <div style={{ fontSize: 13, color: '#0a0a0a', fontWeight: 600, marginBottom: 4 }}>
              {newTopicsCount} new {newTopicsCount === 1 ? 'topic' : 'topics'} reached
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>{dominantDomain}</div>
          </div>
        </div>

        {/* Signal activity bars */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            SIGNAL ACTIVITY
          </div>
          {bars.map((bar, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 52, fontSize: 11, color: '#555', flexShrink: 0 }}>{bar.label}</div>
              <div style={{ flex: 1, height: 5, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', background: bar.color, borderRadius: 3 }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${(bar.avg * 100).toFixed(1)}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 + 0.6, ease: 'easeOut' }}
                />
              </div>
              <div style={{ width: 20, fontSize: 10, color: '#aaa', textAlign: 'right', flexShrink: 0 }}>
                {bar.count}
              </div>
            </div>
          ))}
        </div>

        {/* Frontier topics */}
        {frontierSorted.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              FRONTIER TOPICS
            </div>
            {frontierSorted.map((node, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + i * 0.1, duration: 0.3 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 0',
                  borderBottom: i < frontierSorted.length - 1 ? '1px solid #f5f5f5' : 'none',
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', opacity: 0.6, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#555' }}>{node.label}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Insight */}
        <p style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', lineHeight: 1.5, margin: '4px 0 0' }}>
          The student crossed from familiar territory into {dominantDomain.toLowerCase()} — the hardest frontier.
        </p>
      </div>
    </div>
  )
}
