import type { Session } from '../types'
import { FlipWords } from './ui/FlipWords'
import { TypewriterEffect, toWords } from './ui/TypewriterEffect'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function curate(sample: string[], max = 20): string[] {
  const filtered = [...sample]
    .filter(w => w.length >= 3)
    .sort((a, b) => b.length - a.length)

  const pool = filtered.slice(0, max * 2)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, max)
}

const SIGNAL_MAP: Record<string, string> = {
  strong_growth:   'Strong vocabulary growth',
  good_growth:     'Good vocabulary growth',
  moderate_growth: 'Moderate vocabulary growth',
  low_growth:      'Low vocabulary growth',
  no_growth:       'No new vocabulary this session',
}

function formatSignal(raw: string): string {
  return SIGNAL_MAP[raw] ?? raw.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function NewWordsHero({ session }: { session: Session }) {
  const data = session.new_words
  if (!data || data.new_count === 0) return null

  const flipWords = curate(data.sample ?? [], 20)
  const count  = data.new_count
  const total  = data.total_vocab
  const signal = data.signal ? formatSignal(data.signal) : null

  return (
    <div className="card-premium" style={{
      padding: '44px 48px',
      marginBottom: 32,
    }}>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '200px 1px 1fr',
        gap: '0 52px',
        alignItems: 'start',
      }}>

        {/* ── Left: anchor number ────────────────────────────── */}
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#C4C4C4',
            textTransform: 'uppercase', letterSpacing: '0.12em',
            marginBottom: 18,
          }}>
            New Words
          </div>

          <div style={{
            fontSize: 96,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-0.05em',
            color: '#FF4D7E',
            textShadow: '0 0 40px rgba(255, 77, 126, 0.22)',
            marginBottom: 16,
          }}>
            {count}
          </div>

          {signal && (
            <div style={{
              fontSize: 12, color: '#9CA3AF', lineHeight: 1.5, fontWeight: 500,
            }}>
              {signal}
            </div>
          )}
        </div>

        {/* ── Vertical rule ──────────────────────────────────── */}
        <div style={{ background: '#E6E6E6', alignSelf: 'stretch' }} />

        {/* ── Right: context + rotating word ─────────────────── */}
        <div style={{ paddingTop: 4 }}>

          <div style={{
            fontSize: 22, fontWeight: 700, color: '#111111',
            letterSpacing: '-0.02em', marginBottom: 5,
          }}>
            new words
          </div>

          {total > 0 && (
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 36 }}>
              {total} total vocabulary
            </div>
          )}

          <div style={{
            fontSize: 10, fontWeight: 700, color: '#D1D5DB',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            marginBottom: 12,
          }}>
            Highlighted from this session
          </div>

          {flipWords.length > 0 ? (
            <FlipWords
              words={flipWords}
              duration={2600}
              style={{
                fontSize: 44,
                fontWeight: 800,
                color: '#1F2937',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                marginBottom: 20,
              }}
            />
          ) : (
            <div style={{ height: 64, marginBottom: 20 }} />
          )}

          <div style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>
            <TypewriterEffect
              words={toWords(`You added ${count} new words in this session.`)}
              typingSpeed={38}
            />
          </div>

        </div>
      </div>

    </div>
  )
}
