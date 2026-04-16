import { useEffect } from 'react'
import { motion, stagger, useAnimate } from 'framer-motion'

interface Props {
  words: string
  duration?: number
  filter?: boolean
  className?: string
  style?: React.CSSProperties
}

export function TextGenerateEffect({
  words,
  duration = 0.5,
  filter = true,
  style,
}: Props) {
  const [scope, animate] = useAnimate()
  const wordsArray = words.trim().split(' ')

  useEffect(() => {
    animate(
      'span.word',
      {
        opacity: 1,
        filter: filter ? 'blur(0px)' : 'none',
      },
      {
        duration,
        delay: stagger(0.07),
        ease: [0.25, 0.1, 0.25, 1],
      }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words])

  return (
    <motion.span ref={scope} style={style}>
      {wordsArray.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="word"
          style={{
            opacity: 0,
            filter: filter ? 'blur(8px)' : 'none',
            display: 'inline',
          }}
        >
          {word}
          {i < wordsArray.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </motion.span>
  )
}
