import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Session } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VocabItem {
  word: string
  label: string
  insight: string
  palette: { bg: string; fg: string }
}

// ─── Palettes ─────────────────────────────────────────────────────────────────

const PALETTES: { bg: string; fg: string }[] = [
  { bg: '#F1F5F9', fg: '#475569' },
  { bg: '#F0FDF4', fg: '#166534' },
  { bg: '#FDF4FF', fg: '#7E22CE' },
  { bg: '#FFF7ED', fg: '#9A3412' },
  { bg: '#F0F9FF', fg: '#075985' },
  { bg: '#FEF2F2', fg: '#991B1B' },
  { bg: '#FEFCE8', fg: '#854D0E' },
  { bg: '#F5F3FF', fg: '#5B21B6' },
]

// ─── Data enrichment ──────────────────────────────────────────────────────────

const CONNECTORS = new Set([
  'nevertheless', 'furthermore', 'although', 'however', 'therefore',
  'meanwhile', 'consequently', 'moreover', 'whereas', 'nonetheless',
  'regardless', 'similarly', 'alternatively', 'subsequently', 'indeed',
  'besides', 'meanwhile', 'otherwise', 'instead', 'although',
])

function getLabel(word: string, recalled: boolean): string {
  if (recalled) return 'strong recall'
  if (CONNECTORS.has(word.toLowerCase())) return 'high-value connector'
  if (word.length >= 9) return 'high-value vocabulary'
  if (word.length >= 6) return 'used with confidence'
  return 'reused naturally'
}

function getInsight(word: string, recalled: boolean): string {
  if (recalled) {
    return `"${word}" reappeared this session — a clear sign of early retention. Worth continuing to reinforce in context.`
  }
  if (CONNECTORS.has(word.toLowerCase())) {
    return `A sophisticated linking word. Using "${word}" signals awareness of sentence structure beyond simple vocabulary.`
  }
  if (word.length >= 9) {
    return `"${word}" is a substantive vocabulary item. High value for academic and professional fluency development.`
  }
  if (word.length >= 6) {
    return `"${word}" appeared with enough clarity this session to suggest it's entering active vocabulary.`
  }
  return `"${word}" is a building-block word. Consistent use in natural context will move it from passive to active fluency.`
}

function buildItems(session: Session): VocabItem[] {
  const recalled = new Set((session.active_recall?.words ?? []).map(w => w.toLowerCase()))
  const sample   = session.new_words?.sample ?? []

  const sorted = [...sample].sort((a, b) => {
    const aScore = (recalled.has(a.toLowerCase()) ? 3 : 0)
                 + (CONNECTORS.has(a.toLowerCase()) ? 2 : 0)
                 + a.length * 0.12
    const bScore = (recalled.has(b.toLowerCase()) ? 3 : 0)
                 + (CONNECTORS.has(b.toLowerCase()) ? 2 : 0)
                 + b.length * 0.12
    return bScore - aScore
  })

  return sorted.slice(0, 8).map((word, i) => ({
    word,
    label: getLabel(word, recalled.has(word.toLowerCase())),
    insight: getInsight(word, recalled.has(word.toLowerCase())),
    palette: PALETTES[i % PALETTES.length],
  }))
}

// ─── Typographic tile ─────────────────────────────────────────────────────────

function WordTile({ item }: { item: VocabItem }) {
  return (
    <div style={{
      width: 68, height: 68,
      borderRadius: 12,
      background: item.palette.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{
        fontSize: 30, fontWeight: 800,
        color: item.palette.fg,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        textTransform: 'uppercase',
        userSelect: 'none',
      }}>
        {item.word[0]}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WordsStuck({ session }: { session: Session }) {
  const items = buildItems(session)

  const [active,    setActive]    = useState(0)
  const [direction, setDirection] = useState(1)

  if (items.length === 0) return null

  const item = items[active]

  function goNext() {
    setDirection(1)
    setActive(a => (a + 1) % items.length)
  }

  function goPrev() {
    setDirection(-1)
    setActive(a => (a - 1 + items.length) % items.length)
  }

  function goTo(i: number) {
    setDirection(i > active ? 1 : -1)
    setActive(i)
  }

  return (
    <div
      className="card-premium"
      style={{ marginBottom: 16 }}
      data-why="Measures productive vocabulary — words the student generates spontaneously, not just recognises. The distinction between receptive and productive lexicon is the most undertracked metric in language learning."
    >

      {/* Header row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 28,
      }}>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#BCBCBC',
            textTransform: 'uppercase', letterSpacing: '0.11em',
            marginBottom: 5,
          }}>
            Words that stuck
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.4 }}>
            Vocabulary worth remembering from this session
          </div>
        </div>

        {/* Arrows + counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>
          {(['prev', 'next'] as const).map(dir => (
            <button
              key={dir}
              onClick={dir === 'prev' ? goPrev : goNext}
              style={{
                width: 30, height: 30, borderRadius: '50%',
                border: '1px solid #E5E5E5', background: '#FAFAFA',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, color: '#9CA3AF',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.color = '#111' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5E5'; e.currentTarget.style.color = '#9CA3AF' }}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.2}
                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d={dir === 'prev' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
              </svg>
            </button>
          ))}
          <span style={{ fontSize: 11, color: '#D1D5DB', minWidth: 28, textAlign: 'center' }}>
            {active + 1}/{items.length}
          </span>
        </div>
      </div>

      {/* Card content — draggable, animated */}
      <div style={{ overflow: 'hidden', minHeight: 136 }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={active}
            custom={direction}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.07}
            onDragEnd={(_, info) => {
              if (info.offset.x < -55) goNext()
              else if (info.offset.x > 55) goPrev()
            }}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ display: 'flex', gap: 22, alignItems: 'flex-start', cursor: 'grab' }}
            whileDrag={{ cursor: 'grabbing' }}
          >
            <WordTile item={item} />

            <div style={{ flex: 1 }}>
              {/* Pedagogical label */}
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: '#BCBCBC',
                marginBottom: 10,
              }}>
                {item.label}
              </div>

              {/* The word */}
              <div style={{
                fontSize: 30, fontWeight: 800, color: '#111111',
                letterSpacing: '-0.03em', lineHeight: 1,
                marginBottom: 14,
              }}>
                {item.word}
              </div>

              {/* Insight */}
              <p style={{
                fontSize: 13, color: '#6B7280', lineHeight: 1.65,
                margin: 0, maxWidth: 400,
              }}>
                {item.insight}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 24 }}>
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              height: 5,
              width: i === active ? 18 : 5,
              borderRadius: 3,
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              background: i === active ? '#111111' : '#E5E5E5',
              transition: 'all 0.22s ease',
            }}
          />
        ))}
      </div>

    </div>
  )
}
