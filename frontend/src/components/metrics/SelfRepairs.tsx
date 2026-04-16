import type { SelfRepairs as SelfRepairsType } from '../../types'
import { CountUp } from '../ui/CountUp'

export default function SelfRepairs({ data }: { data: SelfRepairsType }) {
  if (!data?.count && data?.count !== 0) {
    return <p style={{ fontSize: 13, color: '#9CA3AF' }}>No self-repair data</p>
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: 72, fontWeight: 800, color: '#111111',
          lineHeight: 1, letterSpacing: '-0.04em',
        }}>
          <CountUp value={data.count} delay={200} />
        </div>
        <div style={{
          fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase',
          letterSpacing: '0.09em', marginTop: 8,
        }}>
          Self-corrections
        </div>
      </div>

      {data.verdict && (
        <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.55, marginBottom: 16 }}>
          {data.verdict}
        </p>
      )}

      {data.examples?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.examples.slice(0, 2).map((ex, i) => (
            <div
              key={i}
              style={{
                borderLeft: '2px solid #EBEBEB',
                paddingLeft: 12,
                fontSize: 12,
                color: '#9CA3AF',
                fontStyle: 'italic',
                lineHeight: 1.55,
              }}
            >
              "{ex.length > 120 ? ex.slice(0, 120) + '…' : ex}"
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
