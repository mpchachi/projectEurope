import type { NewWords as NewWordsType } from '../../types'

const signalConfig = {
  strong_growth: { label: 'Strong growth', color: '#059669' },
  normal:        { label: 'Normal range',  color: '#6B7280' },
  plateau:       { label: 'Plateau',       color: '#9CA3AF' },
}

export default function NewWords({ data }: { data: NewWordsType }) {
  const sig   = signalConfig[data.signal as keyof typeof signalConfig] ?? signalConfig.normal
  const words = (data.sample ?? []).slice(0, 5)

  return (
    <div>
      {/* Hero numbers */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 32 }}>
        <span style={{
          fontSize: 72, fontWeight: 800, color: '#FF4D7E',
          lineHeight: 1, letterSpacing: '-0.04em',
        }}>
          {data.new_count}
        </span>
        <div>
          <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
            new words
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 3 }}>
            {data.total_vocab} total vocabulary
          </div>
        </div>
      </div>

      {/* Editorial word list */}
      {words.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {words.map((w) => (
            <div
              key={w}
              style={{
                fontSize: 17, fontWeight: 500, color: '#111111',
                borderBottom: '1px solid #EBEBEB',
                padding: '11px 0',
                letterSpacing: '-0.01em',
              }}
            >
              {w}
            </div>
          ))}
        </div>
      )}

      {/* Signal */}
      <div style={{
        fontSize: 10, fontWeight: 700, color: sig.color,
        textTransform: 'uppercase', letterSpacing: '0.09em',
      }}>
        {sig.label}
      </div>
    </div>
  )
}
