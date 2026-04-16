import type { TopicExpansion as TopicExpansionType } from '../../types'

export default function TopicExpansion({ data }: { data: TopicExpansionType }) {
  const newTopics = data.new_topics ?? []
  const recurring = data.recurring_topics ?? []

  if (newTopics.length === 0 && recurring.length === 0) {
    return <p style={{ fontSize: 13, color: '#9CA3AF' }}>No topic data available</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {newTopics.length > 0 && (
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#9CA3AF',
            textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 12,
          }}>
            {newTopics.length} new {newTopics.length === 1 ? 'topic' : 'topics'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {newTopics.map((t) => (
              <span
                key={t}
                style={{
                  padding: '5px 11px', borderRadius: 2,
                  fontSize: 12, fontWeight: 600,
                  background: '#111111', color: '#FFFFFF',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {recurring.length > 0 && (
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#9CA3AF',
            textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 12,
          }}>
            Recurring
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {recurring.map((t) => (
              <span
                key={t}
                style={{
                  padding: '5px 11px', borderRadius: 2,
                  fontSize: 12, fontWeight: 400,
                  background: '#F3F4F6', color: '#6B7280',
                  border: '1px solid #E5E7EB',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
