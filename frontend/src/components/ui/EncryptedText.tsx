import { useEffect, useState } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

interface Props {
  text: string
  startDelayMs?: number             // ms of pure scramble before reveal begins
  revealDelayMs?: number            // ms per character reveal
  scrambleSpeed?: number            // ms between scramble ticks
  style?: React.CSSProperties       // container span
  encryptedStyle?: React.CSSProperties
  revealedStyle?: React.CSSProperties
}

export function EncryptedText({
  text,
  startDelayMs = 0,
  revealDelayMs = 28,
  scrambleSpeed = 45,
  style,
  encryptedStyle,
  revealedStyle,
}: Props) {
  const [started,  setStarted]  = useState(startDelayMs === 0)
  const [revealed, setRevealed] = useState(0)
  const [tick,     setTick]     = useState(0)
  const done = revealed >= text.length

  // Initial hold: scramble-only phase before reveal begins
  useEffect(() => {
    if (startDelayMs === 0) return
    const id = setTimeout(() => setStarted(true), startDelayMs)
    return () => clearTimeout(id)
  }, [startDelayMs])

  // Reveal one character at a time (only after started)
  useEffect(() => {
    if (!started || done) return
    const id = setTimeout(() => setRevealed(r => r + 1), revealDelayMs)
    return () => clearTimeout(id)
  }, [revealed, done, started, revealDelayMs])

  // Independent scramble tick — does NOT restart when revealed changes
  useEffect(() => {
    if (done) return
    const id = setInterval(() => setTick(t => t + 1), scrambleSpeed)
    return () => clearInterval(id)
  }, [done, scrambleSpeed])

  return (
    <span style={style}>
      {text.split('').map((char, i) => {
        const isRevealed = i < revealed
        if (char === ' ') return <span key={i}>&nbsp;</span>

        const display = isRevealed
          ? char
          : CHARS[(tick * 13 + i * 7) % CHARS.length]

        return (
          <span key={i} style={isRevealed ? revealedStyle : encryptedStyle}>
            {display}
          </span>
        )
      })}
    </span>
  )
}
