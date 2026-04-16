import type { ActiveRecall as ActiveRecallType } from '../../types'

export default function ActiveRecall({ data }: { data: ActiveRecallType }) {
  if (data.is_first_session) {
    return (
      <div>
        <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>
          Active Recall
        </div>
        <p style={{ fontSize: 13, color: '#6B7280' }}>First session — no cross-reference yet</p>
      </div>
    )
  }

  const words = data.words ?? []

  return (
    <div>
      {/* Hero */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 72, fontWeight: 800, color: '#111111',
          lineHeight: 1, letterSpacing: '-0.04em',
        }}>
          {data.count}
        </div>
        <div style={{
          fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase',
          letterSpacing: '0.09em', marginTop: 8,
        }}>
          Words recalled from prior session
        </div>
      </div>

      {words.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {words.slice(0, 8).map((w, i) => (
            <div
              key={w}
              style={{
                fontSize: 14, color: '#374151',
                borderBottom: i < Math.min(words.length, 8) - 1 ? '1px solid #F3F4F6' : 'none',
                padding: '8px 0',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {w}
            </div>
          ))}
          {words.length > 8 && (
            <p style={{ fontSize: 11, color: '#9CA3AF', paddingTop: 8 }}>+{words.length - 8} more</p>
          )}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: '#9CA3AF' }}>No specific words tracked</p>
      )}
    </div>
  )
}
