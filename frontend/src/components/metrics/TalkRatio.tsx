import { useEffect, useRef } from 'react'

interface Props {
  studentPercent?: number
  tutorPercent?: number
  silencePercent?: number
}

const COLORS = {
  student: '#FE79AB',
  tutor:   '#5FC7C2',
  silence: '#EFEFF1',
}

const CX = 200, CY = 190, R = 125, SW = 40

function polar(angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180
  return [CX + R * Math.cos(rad), CY - R * Math.sin(rad)]
}

function arcPath(startPct: number, endPct: number): string | null {
  if (endPct - startPct < 0.001) return null
  const [x1, y1] = polar(180 - startPct * 180)
  const [x2, y2] = polar(180 - endPct   * 180)
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

export default function TalkRatio({
  studentPercent = 42,
  tutorPercent   = 51,
  silencePercent = 7,
}: Props) {
  const total  = studentPercent + tutorPercent + silencePercent
  const sPct   = studentPercent / total
  const tPct   = tutorPercent   / total
  const slPct  = silencePercent / total

  const segments = [
    { key: 'student', label: 'Student', pct: sPct,  color: COLORS.student },
    { key: 'tutor',   label: 'Tutor',   pct: tPct,  color: COLORS.tutor   },
    { key: 'silence', label: 'Silence', pct: slPct, color: COLORS.silence },
  ].filter(s => s.pct > 0.001)

  let cum = 0
  const arcs = segments.map(seg => {
    const start = cum
    cum += seg.pct
    return { ...seg, start, end: cum, d: arcPath(start, cum) }
  })

  const pathRefs = useRef<(SVGPathElement | null)[]>([])

  useEffect(() => {
    pathRefs.current.forEach((el, i) => {
      if (!el) return
      const len = el.getTotalLength()
      el.style.strokeDasharray = `${len} ${len}`
      el.style.strokeDashoffset = String(len)
      el.style.transition = 'none'
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = `stroke-dashoffset 0.85s cubic-bezier(0.4,0,0.2,1) ${i * 0.15}s`
        el.style.strokeDashoffset = '0'
      }))
    })
  }, [studentPercent, tutorPercent, silencePercent])

  const bgPath = arcPath(0, 1)!

  return (
    <div style={{ width: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <svg viewBox="0 0 400 240" style={{ width: '100%', display: 'block' }}>
        {/* Background track */}
        <path d={bgPath} fill="none" stroke="#EFEFF1" strokeWidth={SW} strokeLinecap="round" />

        {/* Coloured segments */}
        {arcs.map((arc, i) =>
          arc.d ? (
            <path
              key={arc.key}
              ref={el => { pathRefs.current[i] = el }}
              d={arc.d}
              fill="none"
              stroke={arc.color}
              strokeWidth={SW}
              strokeLinecap="round"
            />
          ) : null
        )}

        {/* Centre percentage — hero number */}
        <text
          x={CX} y={CY + 18}
          textAnchor="middle"
          fill="#121114"
          fontSize={56}
          fontWeight={900}
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {Math.round(studentPercent)}%
        </text>
        <text
          x={CX} y={CY + 44}
          textAnchor="middle"
          fill="#6F6F78"
          fontSize={13}
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          Student speaking time
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8 }}>
        {segments.map(seg => (
          <div key={seg.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: seg.color, flexShrink: 0,
              border: seg.key === 'silence' ? '1.5px solid #D9D9DE' : 'none',
            }} />
            <span style={{ fontSize: 13, color: '#6F6F78' }}>
              {seg.label}{' '}
              <strong style={{ color: '#121114', fontWeight: 700 }}>
                {Math.round(seg.pct * 100)}%
              </strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
