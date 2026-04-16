import { Fragment } from 'react'
import { motion } from 'framer-motion'
import type { TopError } from '../../types'

// ─── LCS word diff ─────────────────────────────────────────────────────────────
// Handles insertions / deletions / substitutions correctly.
// "She is best student" vs "She is the best student" → only "the" is new,
// nothing else wrongly marked.

function norm(w: string) {
  return w.toLowerCase().replace(/[.,!?;:'"()]/g, '')
}

function computeDiff(orig: string, corr: string) {
  const ow = orig.trim().split(/\s+/)
  const cw = corr.trim().split(/\s+/)
  const m = ow.length, n = cw.length

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = norm(ow[i - 1]) === norm(cw[j - 1])
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])

  // Backtrack
  const origChanged = new Set<number>()
  const corrChanged = new Set<number>()
  let i = m, j = n
  while (i > 0 && j > 0) {
    if (norm(ow[i - 1]) === norm(cw[j - 1])) {
      i--; j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      origChanged.add(i - 1); i--
    } else {
      corrChanged.add(j - 1); j--
    }
  }
  while (i > 0) { origChanged.add(i - 1); i-- }
  while (j > 0) { corrChanged.add(j - 1); j-- }

  return { ow, cw, origChanged, corrChanged }
}

// ─── Category badge style ──────────────────────────────────────────────────────

const CAT: Record<string, { bg: string; color: string }> = {
  grammar:       { bg: 'rgba(239,68,68,0.09)',  color: '#EF4444' },
  vocab:         { bg: 'rgba(95,199,194,0.10)', color: '#0D9488' },
  pronunciation: { bg: 'rgba(99,102,241,0.09)', color: '#6366F1' },
}

// ─── Single error card ─────────────────────────────────────────────────────────

function ErrorCard({ error, index }: { error: TopError; index: number }) {
  const { ow, cw, origChanged, corrChanged } = computeDiff(error.error, error.correction)
  const cat = CAT[error.type] ?? { bg: 'rgba(239,68,68,0.09)', color: '#EF4444' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.09, duration: 0.28 }}
      className="rounded-2xl bg-white border border-[#D9D9DE] overflow-hidden"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 pt-4 pb-3">
        <span className="text-[11px] font-mono text-[#D9D9DE]">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span
          className="text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wide"
          style={{ background: cat.bg, color: cat.color }}
        >
          {error.type}
        </span>
      </div>

      {/* Error line */}
      <div className="mx-5 mb-1.5 rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.06)' }}>
        <div className="flex items-start gap-2.5">
          <span className="font-bold text-[#EF4444] text-sm mt-0.5 shrink-0">✗</span>
          <p className="text-[15px] leading-relaxed text-[#121114]">
            {ow.map((word, i) => (
              <Fragment key={i}>
                {origChanged.has(i) ? (
                  <span style={{
                    color: '#EF4444',
                    textDecorationLine: 'line-through',
                    textDecorationColor: '#EF4444',
                    fontWeight: 500,
                  }}>
                    {word}
                  </span>
                ) : (
                  word
                )}
                {i < ow.length - 1 ? ' ' : ''}
              </Fragment>
            ))}
          </p>
        </div>
      </div>

      {/* Correction line */}
      <div className="mx-5 mb-4 rounded-xl px-4 py-3" style={{ background: 'rgba(52,211,153,0.07)' }}>
        <div className="flex items-start gap-2.5">
          <span className="font-bold text-[#059669] text-sm mt-0.5 shrink-0">✓</span>
          <p className="text-[15px] leading-relaxed text-[#121114]">
            {cw.map((word, i) => (
              <Fragment key={i}>
                {corrChanged.has(i) ? (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.09 + 0.18 + i * 0.03, type: 'spring', stiffness: 280 }}
                    style={{
                      color: '#059669',
                      fontWeight: 700,
                      background: 'rgba(52,211,153,0.18)',
                      borderRadius: 4,
                      padding: '1px 4px',
                    }}
                  >
                    {word}
                  </motion.span>
                ) : (
                  word
                )}
                {i < cw.length - 1 ? ' ' : ''}
              </Fragment>
            ))}
          </p>
        </div>
      </div>

      {/* Explanation */}
      <div
        className="mx-5 mb-4 flex items-start gap-2.5 rounded-xl"
        style={{ padding: '10px 14px', background: 'rgba(254,121,171,0.06)' }}
      >
        <span className="text-sm shrink-0 mt-0.5">💡</span>
        <p className="text-[13px] italic text-[#6F6F78] leading-snug">
          {error.explanation}
        </p>
      </div>
    </motion.div>
  )
}

// ─── Export ────────────────────────────────────────────────────────────────────

export default function TopErrors({ data }: { data: TopError[] }) {
  if (!data?.length) {
    return <p className="text-sm text-[#6F6F78]">No errors detected — great session!</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {data.slice(0, 3).map((err, i) => (
        <ErrorCard key={i} error={err} index={i} />
      ))}
    </div>
  )
}
