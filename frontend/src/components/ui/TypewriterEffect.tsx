import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export interface TypewriterWord {
  text: string
  className?: string
}

interface Props {
  words: TypewriterWord[]
  style?: React.CSSProperties
  typingSpeed?: number  // ms per character, default 36
}

export function TypewriterEffect({ words, style, typingSpeed = 36 }: Props) {
  // Pre-compute per-word character ranges (space-separated)
  const segments = words.map((w, i) => {
    const start = words.slice(0, i).reduce((acc, ww) => acc + ww.text.length + 1, 0)
    return { ...w, start, end: start + w.text.length }
  })
  const total = segments[segments.length - 1]?.end ?? 0

  const [typed, setTyped] = useState(0)
  const [done,  setDone]  = useState(false)

  useEffect(() => {
    if (typed >= total) { setDone(true); return }
    const id = setTimeout(() => setTyped(t => t + 1), typingSpeed)
    return () => clearTimeout(id)
  }, [typed, total, typingSpeed])

  if (total === 0) return null

  return (
    <span style={{ display: 'inline', ...style }}>
      {segments.map((seg, i) => {
        const chars = Math.max(0, Math.min(seg.text.length, typed - seg.start))
        if (chars === 0) return null
        const wordDone = typed >= seg.end
        return (
          <span key={i}>
            <span className={wordDone ? seg.className : undefined}>
              {seg.text.slice(0, chars)}
            </span>
            {/* Space between words once this word is fully typed */}
            {wordDone && i < segments.length - 1 ? ' ' : ''}
          </span>
        )
      })}

      {/* Blinking cursor that fades out when done */}
      <motion.span
        aria-hidden
        style={{
          display: 'inline-block',
          width: 1.5,
          height: '0.82em',
          background: 'currentColor',
          opacity: 0.5,
          marginLeft: 2,
          verticalAlign: 'text-bottom',
          borderRadius: 1,
        }}
        animate={done
          ? { opacity: 0 }
          : { opacity: [0.5, 0.5, 0, 0, 0.5] }
        }
        transition={done
          ? { duration: 0.35, delay: 0.7 }
          : { duration: 1.1, repeat: Infinity, ease: 'linear', times: [0, 0.38, 0.5, 0.88, 1] }
        }
      />
    </span>
  )
}

// ─── Helper: split a plain string into TypewriterWord[] ───────────────────────
export function toWords(sentence: string): TypewriterWord[] {
  return sentence.trim().split(/\s+/).map(text => ({ text }))
}
