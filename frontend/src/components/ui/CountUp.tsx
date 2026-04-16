import { useCountUp } from '../../hooks/useCountUp'

interface CountUpProps {
  value: number
  suffix?: string
  prefix?: string
  duration?: number
  delay?: number
  className?: string
}

export function CountUp({
  value,
  suffix = '',
  prefix = '',
  duration = 1200,
  delay = 0,
  className,
}: CountUpProps) {
  const current = useCountUp(value, duration, delay)
  return (
    <span className={className}>
      {prefix}{current}{suffix}
    </span>
  )
}
