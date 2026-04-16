import { motion } from 'framer-motion'

interface Props {
  studentPercent?: number
  tutorPercent?: number
  silencePercent?: number
}

export default function TalkRatio({
  studentPercent = 62,
  tutorPercent = 38,
  silencePercent = 0,
}: Props) {
  const total = studentPercent + tutorPercent + (silencePercent || 0)
  const silence = silencePercent || 0

  const bars = [
    { label: 'Student', pct: studentPercent / total, raw: studentPercent, color: '#FE79AB' },
    { label: 'Tutor',   pct: tutorPercent / total,   raw: tutorPercent,   color: '#5FC7C2' },
    ...(silence / total > 0.01
      ? [{ label: 'Silence', pct: silence / total, raw: silence, color: '#D9D9DE' }]
      : []),
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-6xl font-black text-[#FE79AB] leading-none tracking-tighter">
          {Math.round(studentPercent)}%
        </div>
        <p className="text-[#6F6F78] text-sm mt-1.5">
          Student spoke {Math.round(studentPercent)}% of the time
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {bars.map((bar, i) => (
          <div key={bar.label} className="flex items-center gap-3">
            <span className="text-xs text-[#6F6F78] w-14 shrink-0 font-medium">{bar.label}</span>
            <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-[#F3F3F4]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${bar.pct * 100}%` }}
                transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1], delay: i * 0.12 }}
                className="h-full rounded-full"
                style={{ background: bar.color }}
              />
            </div>
            <span className="text-xs font-bold text-[#121114] w-8 text-right tabular-nums">
              {Math.round(bar.raw)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
