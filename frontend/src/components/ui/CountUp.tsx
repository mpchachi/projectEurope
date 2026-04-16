import { useCountUp } from '../../hooks/useCountUp'

interface CountUpProps {
  value: number
  suffix?: string
  prefix?: string
  duration?: number
  delay?: number
  className?: string
  style?: React.CSSProperties
}

export function CountUp({
  value,
  suffix = '',
  prefix = '',
  duration = 1200,
  delay = 0,
  className,
  style,
}: CountUpProps) {
  const current = useCountUp(value, duration, delay)
  return (
    <span className={className} style={style}>
      {prefix}{current}{suffix}
    </span>
  )
}
