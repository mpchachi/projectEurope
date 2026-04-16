import { useState, useEffect } from 'react'

interface Props {
  studentPercent?: number
  tutorPercent?: number
  silencePercent?: number
}

export default function TalkRatio({
  studentPercent = 42,
  tutorPercent   = 51,
  silencePercent = 7,
}: Props) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60)
    return () => clearTimeout(t)
  }, [studentPercent, tutorPercent, silencePercent])

  const bars = [
    { label: 'Student', pct: studentPercent, primary: true },
    { label: 'Tutor',   pct: tutorPercent,   primary: false },
    { label: 'Silence', pct: Math.max(0, 100 - studentPercent - tutorPercent), primary: false },
  ]

  return (
    <div>
      {/* Hero number */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 80, fontWeight: 800, color: '#111111',
          lineHeight: 1, letterSpacing: '-0.04em',
        }}>
          {Math.round(studentPercent)}%
        </div>
        <div style={{
          fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase',
          letterSpacing: '0.09em', marginTop: 8,
        }}>
          Student speaking time
        </div>
      </div>

      {/* Horizontal bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {bars.map(seg => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 56, fontSize: 11, color: '#9CA3AF',
              flexShrink: 0, textAlign: 'right',
            }}>
              {seg.label}
            </div>
            <div style={{ flex: 1, height: 3, background: '#F0F0F0', borderRadius: 2 }}>
              <div style={{
                height: 3, borderRadius: 2,
                width: ready ? `${seg.pct}%` : '0%',
                background: seg.primary ? '#111111' : '#D4D4D8',
                transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
            <div style={{
              width: 34, fontSize: 12, fontWeight: 600,
              color: '#111111', textAlign: 'right', flexShrink: 0,
            }}>
              {Math.round(seg.pct)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
