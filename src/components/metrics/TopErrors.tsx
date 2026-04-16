import { motion } from 'framer-motion'
import type { TopError } from '../../types'

const typeStyle: Record<string, { bg: string; color: string }> = {
  grammar:       { bg: 'rgba(254,121,171,0.10)', color: '#FE79AB' },
  vocab:         { bg: 'rgba(95,199,194,0.10)',  color: '#5FC7C2' },
  pronunciation: { bg: 'rgba(17,17,20,0.07)',    color: '#121114' },
}

export default function TopErrors({ data }: { data: TopError[] }) {
  if (!data?.length) {
    return <div className="text-[#6F6F78] text-sm">No errors detected</div>
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((e, i) => {
        const ts = typeStyle[e.type] ?? { bg: 'rgba(111,111,120,0.08)', color: '#6F6F78' }
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl overflow-hidden border border-[#D9D9DE]"
          >
            <div
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
              style={{ background: ts.bg, color: ts.color }}
            >
              {e.type}
            </div>
            <div className="p-3 flex flex-col gap-2 bg-white">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-[#EF4444] text-xs mt-0.5 shrink-0 font-bold">✗</span>
                  <span className="text-[#121114] text-sm italic">"{e.error}"</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#34D399] text-xs mt-0.5 shrink-0 font-bold">✓</span>
                  <span className="text-[#059669] text-sm font-semibold">"{e.correction}"</span>
                </div>
              </div>
              {e.explanation && (
                <p className="text-[#6F6F78] text-xs leading-relaxed border-t border-[#EFEFF1] pt-2">
                  {e.explanation}
                </p>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
