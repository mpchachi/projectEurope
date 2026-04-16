import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { Agency } from '../../types'

const statusLabel: Record<string, { label: string; color: string }> = {
  reactive:   { label: 'Passenger — waits to be asked',  color: '#EF4444' },
  developing: { label: 'Developing independence',        color: '#6F6F78' },
  proactive:  { label: 'Driver — owns the conversation', color: '#34D399' },
}

const CX = 160, CY = 145, R = 108, SW = 30

function polar(angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180
  return [CX + R * Math.cos(rad), CY - R * Math.sin(rad)]
}

function arcPath(startPct: number, endPct: number): string | null {
  if (endPct - startPct < 0.001) return null
  const [x1, y1] = polar(180 - startPct * 180)
  const [x2, y2] = polar(180 - endPct * 180)
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

export default function AgencyGauge({ data }: { data: Agency }) {
  const st = statusLabel[data.status] ?? statusLabel.developing
  const fillPct = Math.min(1, Math.max(0, data.score / 10))
  const pathRef = useRef<SVGPathElement | null>(null)

  useEffect(() => {
    const el = pathRef.current
    if (!el) return
    const len = el.getTotalLength()
    el.style.strokeDasharray = `${len} ${len}`
    el.style.strokeDashoffset = String(len)
    el.style.transition = 'none'
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)'
      el.style.strokeDashoffset = '0'
    }))
  }, [data.score])

  const gaugeColor = data.score >= 6 ? '#34D399' : data.score >= 3 ? '#FE79AB' : '#EF4444'
  const bgPath = arcPath(0, 1)!
  const fillPath = arcPath(0, fillPct)

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 320 160" style={{ width: '100%', display: 'block' }}>
        {/* Background track */}
        <path d={bgPath} fill="none" stroke="#EFEFF1" strokeWidth={SW} strokeLinecap="round" />

        {/* Filled arc */}
        {fillPath && (
          <path
            ref={pathRef}
            d={fillPath}
            fill="none"
            stroke={gaugeColor}
            strokeWidth={SW}
            strokeLinecap="round"
          />
        )}

        {/* Score */}
        <text
          x={CX} y={CY + 6}
          textAnchor="middle"
          fill="#121114"
          fontSize={52}
          fontWeight={900}
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {data.score.toFixed(1)}
        </text>
        <text
          x={CX} y={CY + 28}
          textAnchor="middle"
          fill="#6F6F78"
          fontSize={12}
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          out of 10
        </text>
      </svg>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-sm font-semibold"
        style={{ color: st.color }}
      >
        {st.label}
      </motion.p>

      <div className="grid grid-cols-2 gap-2 w-full text-center text-xs">
        <div className="rounded-xl p-3 bg-[#F3F3F4]">
          <div className="text-[#121114] font-black text-xl">{data.initiations}</div>
          <div className="text-[#6F6F78] mt-0.5">Initiations</div>
        </div>
        <div className="rounded-xl p-3 bg-[#F3F3F4]">
          <div className="text-[#121114] font-black text-xl">{data.responses}</div>
          <div className="text-[#6F6F78] mt-0.5">Responses</div>
        </div>
      </div>

      <p className="text-xs text-[#6F6F78]">{data.pct.toFixed(0)}% student-initiated</p>
    </div>
  )
}
