import type { FillerPressure as FillerPressureType } from '../../types'
import { CountUp } from '../ui/CountUp'

export default function FillerPressure({ data }: { data: FillerPressureType }) {
  const entries = Object.entries(data.by_topic ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)

  if (!entries.length) {
    return <p style={{ fontSize: 13, color: '#9CA3AF' }}>No filler data available</p>
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 72, fontWeight: 800, color: '#111111',
          lineHeight: 1, letterSpacing: '-0.04em',
        }}>
          <CountUp value={data.total} delay={100} />
        </div>
        <div style={{
          fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase',
          letterSpacing: '0.09em', marginTop: 8,
        }}>
          Filler words
        </div>
      </div>

      {/* Topic breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {entries.map(([topic, count], i) => (
          <div
            key={topic}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0',
              borderBottom: i < entries.length - 1 ? '1px solid #F3F4F6' : 'none',
            }}
          >
            <span style={{ fontSize: 13, color: '#6B7280' }}>{topic}</span>
            <span style={{
              fontSize: 14, fontWeight: 700,
              color: i === 0 ? '#111111' : '#9CA3AF',
            }}>
              {count}
            </span>
          </div>
        ))}
      </div>

      {data.worst_topic && (
        <p style={{ marginTop: 16, fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Highest: <span style={{ color: '#111111', fontWeight: 700 }}>{data.worst_topic}</span>
        </p>
      )}
    </div>
  )
}
