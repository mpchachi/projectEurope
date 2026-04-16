import { motion } from 'framer-motion'
import type { GrayZones as GrayZonesType } from '../../types'

export default function GrayZones({ data }: { data: GrayZonesType }) {
  const avoided = data.avoided ?? []

  if (!avoided.length) {
    return (
      <div className="flex items-center justify-center h-32 text-[#6F6F78] text-sm">
        No avoidance patterns detected
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl font-black text-[#121114]">{avoided.length}</span>
        <span className="text-[#6F6F78] text-sm">avoided structures</span>
      </div>

      {avoided.map((z, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="rounded-xl p-3.5"
          style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
              style={{ background: 'rgba(239,68,68,0.10)', color: '#EF4444' }}
            >
              avoided
            </span>
            <span className="text-[#121114] text-sm font-semibold">{z.structure}</span>
          </div>
          <p className="text-[#6F6F78] text-xs leading-relaxed">
            <span className="text-[#121114] font-medium">Expected: </span>{z.expected_because}
          </p>
          {z.evidence && (
            <p className="text-[#6F6F78] text-xs mt-1.5 italic opacity-70">"{z.evidence}"</p>
          )}
        </motion.div>
      ))}

      {data.verdict && (
        <p className="text-xs text-[#6F6F78] border-t border-[#D9D9DE] pt-3 mt-1">{data.verdict}</p>
      )}
    </div>
  )
}
