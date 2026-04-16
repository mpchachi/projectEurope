import { useState, useEffect } from 'react'
import { useMotionValue, animate } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TalkRatioOrganicProps {
  studentPercent?: number
  tutorPercent?: number
  studentName?: string
  tutorName?: string
}

// ─── SVG helpers ─────────────────────────────────────────────────────────────

const SVG_W = 600
const SVG_H = 280
const DELTA = 8

function studentPath(bx: number, wave: number): string {
  const top = bx + wave
  const mid = bx - wave
  const bot = bx + wave
  return `M 0,0 L ${top},0 C ${top},${SVG_H * 0.25} ${mid},${SVG_H * 0.35} ${mid},${SVG_H * 0.5} S ${bot},${SVG_H * 0.75} ${bot},${SVG_H} L 0,${SVG_H} Z`
}

function tutorPath(bx: number, wave: number): string {
  const top = bx + wave
  const mid = bx - wave
  const bot = bx + wave
  return `M ${top},0 L ${SVG_W},0 L ${SVG_W},${SVG_H} L ${bot},${SVG_H} C ${bot},${SVG_H * 0.75} ${mid},${SVG_H * 0.65} ${mid},${SVG_H * 0.5} S ${top},${SVG_H * 0.25} ${top},0 Z`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TalkRatio({
  studentPercent = 62,
  tutorPercent   = 38,
  studentName    = 'Student',
  tutorName      = 'Tutor',
}: TalkRatioOrganicProps) {
  const finalBx    = (studentPercent / 100) * SVG_W
  const bxMotion   = useMotionValue(SVG_W / 2)
  const waveMotion = useMotionValue(0)

  const [hoverSide, setHoverSide]   = useState<'student' | 'tutor' | null>(null)
  const [ready, setReady]           = useState(false)
  const [currentBx, setCurrentBx]   = useState(SVG_W / 2)
  const [paths, setPaths]           = useState({
    s: studentPath(SVG_W / 2, 0),
    t: tutorPath(SVG_W / 2, 0),
  })

  // Entry animation — boundary slides from center to final position
  useEffect(() => {
    setReady(false)
    const ctrl = animate(bxMotion, finalBx, {
      duration:   1.2,
      ease:       [0.33, 1, 0.68, 1],
      delay:      0.2,
      onComplete: () => setReady(true),
    })
    return () => ctrl.stop()
  }, [finalBx])

  // Pulse animation — wave breathes after entry completes
  useEffect(() => {
    if (!ready) return
    const amp = hoverSide === 'student' ? 40 : hoverSide === 'tutor' ? 8 : 24
    const ctrl = animate(waveMotion, [amp, -amp * 0.75, amp], {
      duration:   4,
      repeat:     Infinity,
      ease:       'easeInOut',
    })
    return () => ctrl.stop()
  }, [ready, hoverSide])

  // Sync motion values → state for SVG paths
  useEffect(() => {
    const update = () => {
      const bx = bxMotion.get()
      const w  = waveMotion.get()
      setCurrentBx(bx)
      setPaths({ s: studentPath(bx, w), t: tutorPath(bx, w) })
    }
    const u1 = bxMotion.on('change', update)
    const u2 = waveMotion.on('change', update)
    return () => { u1(); u2() }
  }, [])

  const studentTextX = currentBx / 2
  const tutorTextX   = currentBx + (SVG_W - currentBx) / 2
  const narrow       = studentPercent < 25

  const winnerText =
    studentPercent > 50 ? '↑ more than the tutor today'
    : studentPercent === 50 ? 'Equal time'
    : null

  return (
    <div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@700;900&display=swap');`}</style>

      {/* Blob SVG */}
      <div style={{
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: studentPercent > 50 ? '0 0 60px rgba(255,71,133,0.12)' : undefined,
      }}>
        <svg
          width="100%"
          height={SVG_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="none"
        >
          <defs>
            <radialGradient id="trStudentGrad" cx="40%" cy="50%" r="60%">
              <stop offset="0%"   stopColor="#ff6ba3" />
              <stop offset="100%" stopColor="#FF4785" />
            </radialGradient>
            <radialGradient id="trTutorGrad" cx="60%" cy="50%" r="60%">
              <stop offset="0%"   stopColor="#1a1a1a" />
              <stop offset="100%" stopColor="#0a0a0a" />
            </radialGradient>
          </defs>

          {/* Student blob */}
          <path
            d={paths.s}
            fill="url(#trStudentGrad)"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoverSide('student')}
            onMouseLeave={() => setHoverSide(null)}
          />

          {/* Tutor blob */}
          <path
            d={paths.t}
            fill="url(#trTutorGrad)"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoverSide('tutor')}
            onMouseLeave={() => setHoverSide(null)}
          />

          {/* Student percentage text */}
          <text
            x={narrow ? currentBx + 24 : studentTextX}
            y={SVG_H / 2 - 8}
            textAnchor="middle"
            fill={narrow ? '#0a0a0a' : '#ffffff'}
            fontFamily="'Playfair Display', serif"
            fontSize={64}
            fontWeight={900}
          >
            {studentPercent}%
          </text>
          <text
            x={narrow ? currentBx + 24 : studentTextX}
            y={SVG_H / 2 + 24}
            textAnchor="middle"
            fill={narrow ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)'}
            fontFamily="'DM Sans', sans-serif"
            fontSize={13}
          >
            {studentName}
          </text>

          {/* Tutor percentage text */}
          <text
            x={tutorTextX}
            y={SVG_H / 2 - 8}
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="'Playfair Display', serif"
            fontSize={64}
            fontWeight={900}
          >
            {tutorPercent}%
          </text>
          <text
            x={tutorTextX}
            y={SVG_H / 2 + 24}
            textAnchor="middle"
            fill="rgba(255,255,255,0.5)"
            fontFamily="'DM Sans', sans-serif"
            fontSize={13}
          >
            {tutorName}
          </text>
        </svg>
      </div>

      {/* Winner indicator */}
      {winnerText && (
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#888', fontFamily: "'DM Sans', sans-serif" }}>
          {studentPercent > 50 && <span style={{ color: '#FF4785' }}>↑ </span>}
          {studentPercent > 50 ? 'more than the tutor today' : winnerText}
        </div>
      )}

      {/* Last session delta */}
      <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, color: '#bbb', fontFamily: "'DM Sans', sans-serif" }}>
        Last session: {studentPercent - DELTA}% · +{DELTA}% more than before
      </div>
    </div>
  )
}
