import { useEffect, useRef, useState } from 'react'

interface TooltipState {
  visible: boolean
  x: number
  y: number
  text: string
}

export function MetricTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, text: '',
  })
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const target = e.target as HTMLElement
      const card = target.closest('[data-why]') as HTMLElement | null
      if (card) {
        const text = card.dataset.why || ''
        setTooltip({ visible: true, x: e.clientX, y: e.clientY, text })
      } else {
        setTooltip(prev => ({ ...prev, visible: false }))
      }
    }
    function onMouseLeave() {
      setTooltip(prev => ({ ...prev, visible: false }))
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  useEffect(() => {
    const el = tooltipRef.current
    if (!el) return
    const offset = 20
    const w = el.offsetWidth
    const h = el.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight
    let x = tooltip.x + offset
    let y = tooltip.y + offset
    if (x + w > vw - 20) x = tooltip.x - w - offset
    if (y + h > vh - 20) y = tooltip.y - h - offset
    el.style.left = x + 'px'
    el.style.top  = y + 'px'
  }, [tooltip.x, tooltip.y, tooltip.visible])

  return (
    <div
      ref={tooltipRef}
      style={{
        position: 'fixed',
        zIndex: 9998,
        pointerEvents: 'none',
        maxWidth: 280,
        opacity: tooltip.visible ? 1 : 0,
        transform: tooltip.visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(4px)',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
        background: 'rgba(10, 10, 10, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 71, 133, 0.2)',
        borderRadius: 12,
        padding: '14px 18px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,71,133,0.05)',
      }}
    >
      {/* Pink accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 16, right: 16, height: 1,
        background: 'linear-gradient(90deg, transparent, #FF4785, transparent)',
        borderRadius: 1,
      }} />
      <p style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 1.65,
        fontWeight: 300,
        fontStyle: 'italic',
        margin: 0,
      }}>
        {tooltip.text}
      </p>
    </div>
  )
}
