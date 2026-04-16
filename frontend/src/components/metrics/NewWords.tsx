import { motion } from 'framer-motion'
import type { NewWords as NewWordsType } from '../../types'

const signalConfig = {
  strong_growth: { label: 'Strong vocabulary growth', color: '#34D399' },
  normal:        { label: 'Normal vocabulary range',  color: '#5FC7C2' },
  plateau:       { label: 'Vocabulary plateau',        color: '#6F6F78' },
}

export default function NewWords({ data }: { data: NewWordsType }) {
  const sig   = signalConfig[data.signal as keyof typeof signalConfig] ?? signalConfig.normal
  const words = data.sample ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-5">
        <div>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150 }}
            className="text-6xl font-black text-[#FE79AB] leading-none"
          >
            {data.new_count}
          </motion.div>
          <div className="text-[#6F6F78] text-xs mt-1.5">new words</div>
        </div>
        <div className="pb-1">
          <div className="text-3xl font-black text-[#121114] leading-none">{data.total_vocab}</div>
          <div className="text-[#6F6F78] text-xs mt-1">total vocab</div>
        </div>
      </div>

      <span
        className="text-xs px-3 py-1.5 rounded-full w-fit font-semibold"
        style={{ color: sig.color, background: sig.color + '14', border: `1px solid ${sig.color}30` }}
      >
        {sig.label}
      </span>

      {words.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {words.map((w, i) => (
            <motion.span
              key={w}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 260 }}
              className="px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{ background: 'rgba(254,121,171,0.09)', color: '#FE79AB', border: '1px solid rgba(254,121,171,0.18)' }}
            >
              {w}
            </motion.span>
          ))}
        </div>
      )}
    </div>
  )
}
