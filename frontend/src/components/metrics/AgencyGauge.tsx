import type { Agency } from '../../types'

const statusNarrative: Record<string, string> = {
  reactive:   'Following the tutor\'s lead throughout the session',
  developing: 'Building independence — initiating more each session',
  proactive:  'Leading the conversation with confidence',
}

export default function AgencyGauge({ data }: { data: Agency }) {
  const narrative = statusNarrative[data.status] ?? statusNarrative.developing

  return (
    <div>
      {/* Hero % */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 80, fontWeight: 800, color: '#FF4D7E',
          lineHeight: 1, letterSpacing: '-0.04em',
        }}>
          {data.pct.toFixed(0)}%
        </div>
        <div style={{
          fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase',
          letterSpacing: '0.09em', marginTop: 8,
        }}>
          Student-initiated exchanges
        </div>
      </div>

      {/* Narrative */}
      <p style={{
        fontSize: 15, color: '#111111', lineHeight: 1.5,
        marginBottom: 28, maxWidth: 280,
      }}>
        {narrative}
      </p>

      {/* Supporting stats */}
      <div style={{
        display: 'flex', gap: 32,
        borderTop: '1px solid #EBEBEB', paddingTop: 20,
      }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#111111', letterSpacing: '-0.02em' }}>
            {data.initiations}
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>
            Initiations
          </div>
        </div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#111111', letterSpacing: '-0.02em' }}>
            {data.responses}
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>
            Responses
          </div>
        </div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#111111', letterSpacing: '-0.02em' }}>
            {data.score.toFixed(1)}
            <span style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 400 }}>/10</span>
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>
            Agency Score
          </div>
        </div>
      </div>
    </div>
  )
}
