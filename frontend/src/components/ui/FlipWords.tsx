import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  words: string[]
  duration?: number
  style?: React.CSSProperties
}

export function FlipWords({ words, duration = 2600, style }: Props) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (words.length <= 1) return
    const id = setInterval(() => setIndex(i => (i + 1) % words.length), duration)
    return () => clearInterval(id)
  }, [words, duration])

  if (!words.length) return null

  return (
    <div style={{ position: 'relative', height: 60, display: 'flex', alignItems: 'center', ...style }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -16, filter: 'blur(8px)' }}
          transition={{ duration: 0.48, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ position: 'absolute' }}
        >
          {words[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
