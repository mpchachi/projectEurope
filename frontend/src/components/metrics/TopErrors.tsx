import { Fragment } from 'react'
import type { TopError } from '../../types'

// ─── LCS word diff ─────────────────────────────────────────────────────────────

function norm(w: string) {
  return w.toLowerCase().replace(/[.,!?;:'"()]/g, '')
}

function computeDiff(orig: string, corr: string) {
  const ow = orig.trim().split(/\s+/)
  const cw = corr.trim().split(/\s+/)
  const m = ow.length, n = cw.length

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = norm(ow[i - 1]) === norm(cw[j - 1])
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])

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

// ─── Category color ────────────────────────────────────────────────────────────

const CAT_COLOR: Record<string, string> = {
  grammar:       '#DC2626',
  vocab:         '#374151',
  pronunciation: '#4F46E5',
}

// ─── Single error ──────────────────────────────────────────────────────────────

function ErrorItem({ error, index, isLast }: { error: TopError; index: number; isLast: boolean }) {
  const { ow, cw, origChanged, corrChanged } = computeDiff(error.error, error.correction)
  const color = CAT_COLOR[error.type] ?? CAT_COLOR.grammar

  return (
    <div style={{
      paddingBottom: isLast ? 0 : 28,
      borderBottom: isLast ? 'none' : '1px solid #EBEBEB',
      marginBottom: isLast ? 0 : 28,
    }}>
      {/* Type label */}
      <div style={{
        fontSize: 10, fontWeight: 700, color,
        textTransform: 'uppercase', letterSpacing: '0.09em',
        marginBottom: 10,
      }}>
        {String(index + 1).padStart(2, '0')} · {error.type}
      </div>

      {/* Error line */}
      <div style={{ marginBottom: 6 }}>
        <p style={{ fontSize: 14, lineHeight: 1.5, color: '#111111', margin: 0 }}>
          {ow.map((word, i) => (
            <Fragment key={i}>
              {origChanged.has(i) ? (
                <span style={{
                  color: '#EF4444',
                  textDecorationLine: 'line-through',
                  textDecorationColor: '#EF4444',
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

      {/* Correction line */}
      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 14, lineHeight: 1.5, color: '#111111', margin: 0 }}>
          {cw.map((word, i) => (
            <Fragment key={i}>
              {corrChanged.has(i) ? (
                <span style={{
                  color: '#059669',
                  fontWeight: 600,
                }}>
                  {word}
                </span>
              ) : (
                word
              )}
              {i < cw.length - 1 ? ' ' : ''}
            </Fragment>
          ))}
        </p>
      </div>

      {/* Explanation */}
      <p style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.55, margin: 0 }}>
        {error.explanation}
      </p>
    </div>
  )
}

// ─── Export ────────────────────────────────────────────────────────────────────

export default function TopErrors({ data }: { data: TopError[] }) {
  if (!data?.length) {
    return <p style={{ fontSize: 13, color: '#9CA3AF' }}>No errors detected — great session.</p>
  }

  return (
    <div>
      {data.slice(0, 3).map((err, i) => (
        <ErrorItem key={i} error={err} index={i} isLast={i === Math.min(data.length, 3) - 1} />
      ))}
    </div>
  )
}
