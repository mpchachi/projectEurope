import type { GrayZones as GrayZonesType } from '../../types'

export default function GrayZones({ data }: { data: GrayZonesType }) {
  const avoided = data.avoided ?? []

  if (!avoided.length) {
    return (
      <p style={{ fontSize: 13, color: '#9CA3AF' }}>No avoidance patterns detected</p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Monochrome pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {avoided.map((z, i) => (
          <div
            key={i}
            style={{
              padding: '5px 12px',
              border: '1px solid #111111',
              borderRadius: 2,
              fontSize: 11, fontWeight: 700, color: '#111111',
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}
          >
            {z.structure}
          </div>
        ))}
      </div>

      {/* Detail list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {avoided.map((z, i) => (
          <div key={i} style={{ paddingBottom: 16, borderBottom: i < avoided.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#111111',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
            }}>
              {z.structure}
            </div>
            <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.55, margin: 0 }}>
              {z.expected_because}
            </p>
            {z.evidence && (
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, fontStyle: 'italic', margin: '4px 0 0' }}>
                "{z.evidence}"
              </p>
            )}
          </div>
        ))}
      </div>

      {data.verdict && (
        <p style={{ fontSize: 12, color: '#9CA3AF' }}>{data.verdict}</p>
      )}
    </div>
  )
}
