import { motion } from 'framer-motion'
import type { TopicExpansion as TopicExpansionType } from '../../types'

export default function TopicExpansion({ data }: { data: TopicExpansionType }) {
  const newTopics = data.new_topics ?? []
  const recurring = data.recurring_topics ?? []

  return (
    <div className="flex flex-col gap-4">
      {newTopics.length > 0 && (
        <div>
          <p className="text-xs text-[#34D399] font-semibold uppercase tracking-wider mb-2">
            {newTopics.length} new topics unlocked
          </p>
          <div className="flex flex-wrap gap-2">
            {newTopics.map((t, i) => (
              <motion.span
                key={t}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(52,211,153,0.10)', color: '#059669', border: '1px solid rgba(52,211,153,0.22)' }}
              >
                + {t}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {recurring.length > 0 && (
        <div>
          <p className="text-xs text-[#6F6F78] uppercase tracking-wider mb-2 font-medium">Recurring</p>
          <div className="flex flex-wrap gap-2">
            {recurring.map((t, i) => (
              <motion.span
                key={t}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: '#F3F3F4', color: '#6F6F78', border: '1px solid #D9D9DE' }}
              >
                ↻ {t}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {newTopics.length === 0 && recurring.length === 0 && (
        <div className="text-[#6F6F78] text-sm">No topic data available</div>
      )}
    </div>
  )
}
