import { motion } from 'framer-motion'
import type { ActiveRecall as ActiveRecallType } from '../../types'

export default function ActiveRecall({ data }: { data: ActiveRecallType }) {
  if (data.is_first_session) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2 text-[#6F6F78] text-sm">
        <span className="text-3xl">📚</span>
        First session — nothing to cross-reference yet
      </div>
    )
  }

  const words = data.words ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 150 }}
          className="text-6xl font-black text-[#FE79AB] leading-none tracking-tighter"
        >
          {data.count}
        </motion.div>
        <div className="pb-1.5">
          <div className="text-[#121114] text-sm font-bold">words recalled</div>
          <div className="text-[#6F6F78] text-xs mt-0.5">from previous session</div>
        </div>
      </div>

      {words.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {words.slice(0, 8).map((w, i) => (
            <motion.div
              key={w}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 200 }}
              className="flex items-center gap-2.5"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.07 + 0.15, type: 'spring', stiffness: 300 }}
                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{ background: '#34D399' }}
              >
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <span className="text-sm text-[#121114] font-medium">{w}</span>
            </motion.div>
          ))}
          {words.length > 8 && (
            <p className="text-xs text-[#6F6F78] pl-6">+{words.length - 8} more</p>
          )}
        </div>
      ) : (
        <p className="text-[#6F6F78] text-sm">No specific words tracked</p>
      )}
    </div>
  )
}
