import { useEffect, useState } from 'react'

export function useCountUp(
  target: number,
  duration: number = 1200,
  delay: number = 0,
) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    let rafId: number

    const delayTimeout = setTimeout(() => {
      function tick(timestamp: number) {
        if (!startTime) startTime = timestamp
        const elapsed  = timestamp - startTime
        const progress = Math.min(elapsed / duration, 1)
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(eased * target))
        if (progress < 1) rafId = requestAnimationFrame(tick)
      }
      rafId = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(delayTimeout)
      cancelAnimationFrame(rafId)
    }
  }, [target, duration, delay])

  return value
}
