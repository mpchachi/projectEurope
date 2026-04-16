import type { Session } from '../types'
import { DraggableCard } from './ui/DraggableCard'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Artifact {
  label: string
  accent: string
  content: string
  footnote?: string
}

// ─── Build artifacts from session data ────────────────────────────────────────

function buildArtifacts(session: Session): Artifact[] {
  const artifacts: Artifact[] = []

  // Self-correction of the day
  if (session.self_repairs?.count > 0 && session.self_repairs.examples?.length > 0) {
    artifacts.push({
      label: 'Self-correction of the day',
      accent: '#FF4D7E',
      content: session.self_repairs.examples[0],
      footnote: `${session.self_repairs.count} repair${session.self_repairs.count !== 1 ? 's' : ''} this session`,
    })
  }

  // Word that stuck
  if (session.new_words?.sample?.length > 0) {
    artifacts.push({
      label: 'Word that stuck',
      accent: '#4F46E5',
      content: session.new_words.sample[0],
      footnote: `+${session.new_words.new_count} new word${session.new_words.new_count !== 1 ? 's' : ''} this session`,
    })
  }

  // Grammar avoided (gray zone)
  if (session.gray_zones?.avoided?.length > 0) {
    const gz = session.gray_zones.avoided[0]
    artifacts.push({
      label: 'Grammar you avoided',
      accent: '#059669',
      content: gz.structure,
      footnote: gz.expected_because,
    })
  }

  // You took initiative
  if (session.agency?.intents?.length > 0) {
    artifacts.push({
      label: 'You took initiative',
      accent: '#B45309',
      content: session.agency.intents[0],
      footnote: `Agency score: ${session.agency.pct}%`,
    })
  }

  // Correction to remember
  if (session.top_errors?.length > 0) {
    const err = session.top_errors[0]
    artifacts.push({
      label: 'Correction to remember',
      accent: '#DC2626',
      content: `"${err.error}" → "${err.correction}"`,
      footnote: err.explanation?.length > 80
        ? err.explanation.slice(0, 80) + '…'
        : err.explanation,
    })
  }

  return artifacts.slice(0, 5)
}

// ─── Single artifact card ─────────────────────────────────────────────────────

function ArtifactCard({ artifact, index }: { artifact: Artifact; index: number }) {
  return (
    <DraggableCard delay={index * 0.06} style={{ width: 196 }}>
      <div style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
        border: 'none',
        borderRadius: 12,
        padding: '18px 20px 16px',
        height: 168,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: [
          '0 1px 2px rgba(0,0,0,0.04)',
          '0 6px 20px rgba(0,0,0,0.06)',
          'inset 0 0 0 1px rgba(0,0,0,0.08)',
          'inset 0 1px 0 rgba(255,255,255,0.8)',
        ].join(', '),
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}>

        {/* Accent dot + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: artifact.accent, flexShrink: 0,
          }} />
          <span style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: '#BCBCBC',
          }}>
            {artifact.label}
          </span>
        </div>

        {/* Main content */}
        <div style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 600,
          color: '#111111',
          lineHeight: 1.5,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
        }}>
          {artifact.content}
        </div>

        {/* Footnote */}
        {artifact.footnote && (
          <div style={{
            marginTop: 10,
            fontSize: 10,
            color: '#9CA3AF',
            lineHeight: 1.4,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}>
            {artifact.footnote}
          </div>
        )}

      </div>
    </DraggableCard>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function SessionArtifacts({ session }: { session: Session }) {
  const artifacts = buildArtifacts(session)
  if (artifacts.length === 0) return null

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: '#BCBCBC',
        textTransform: 'uppercase', letterSpacing: '0.11em',
        marginBottom: 12,
      }}>
        Session Artifacts
      </div>
      <div style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        overflowY: 'visible',
        paddingBottom: 4,
        scrollbarWidth: 'none',
      }}>
        {artifacts.map((artifact, i) => (
          <ArtifactCard key={i} artifact={artifact} index={i} />
        ))}
      </div>
    </div>
  )
}
