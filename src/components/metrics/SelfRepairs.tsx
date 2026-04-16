import { motion } from 'framer-motion'
import type { SelfRepairs as SelfRepairsType } from '../../types'

export default function SelfRepairs({ data }: { data: SelfRepairsType }) {
  if (!data?.count && data?.count !== 0) {
    return <div className="text-[#6F6F78] text-sm">No self-repair data</div>
  }

  const color = data.count >= 3 ? '#34D399' : data.count === 0 ? '#6F6F78' : '#FE79AB'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 150 }}
          className="text-6xl font-black leading-none tracking-tighter"
          style={{ color }}
        >
          {data.count}
        </motion.div>
        <span className="text-[#6F6F78] text-sm pb-1.5 font-medium">self-corrections</span>
      </div>

      {data.verdict && (
        <p className="text-sm text-[#121114] leading-relaxed">{data.verdict}</p>
      )}

      {data.examples?.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.examples.slice(0, 2).map((ex, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="border-l-2 pl-3 text-xs text-[#6F6F78] italic leading-relaxed"
              style={{ borderColor: color + '70' }}
            >
              "{ex.length > 120 ? ex.slice(0, 120) + '…' : ex}"
            </motion.blockquote>
          ))}
        </div>
      )}
    </div>
  )
}
