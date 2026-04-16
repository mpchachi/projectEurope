import ReactECharts from 'echarts-for-react'
import type { SentimentArc as SentimentArcType } from '../../types'

const directionLabel: Record<string, string> = {
  warming:    'Confidence building through the session',
  cooling:    'Pressure increasing toward the end',
  consistent: 'Consistent emotional tone throughout',
}

export default function SentimentArc({ data }: { data: SentimentArcType }) {
  if (!data.available || !data.data.length) {
    return (
      <p style={{ fontSize: 13, color: '#9CA3AF' }}>No sentiment data available</p>
    )
  }

  const points = data.data.map(p =>
    p.s === 'positive' ? 1 : p.s === 'negative' ? -1 : 0
  )

  const option = {
    backgroundColor: 'transparent',
    grid: { left: 0, right: 0, top: 8, bottom: 8, containLabel: false },
    xAxis: { type: 'category', show: false },
    yAxis: { type: 'value', min: -1.5, max: 1.5, show: false },
    series: [
      {
        type: 'line',
        data: points,
        smooth: 0.6,
        symbol: 'none',
        lineStyle: { width: 1.5, color: '#111111' },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#EBEBEB', type: 'solid', width: 1 },
          data: [{ yAxis: 0 }],
        },
      },
    ],
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
  }

  return (
    <div>
      {/* Clean line chart */}
      <ReactECharts option={option} style={{ height: 90 }} />

      {/* Inline stats */}
      <div style={{ display: 'flex', gap: 24, marginTop: 16, borderTop: '1px solid #F3F4F6', paddingTop: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111111', letterSpacing: '-0.02em' }}>
            {data.positive_pct}%
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>
            Confident
          </div>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111111', letterSpacing: '-0.02em' }}>
            {data.neutral_pct}%
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>
            Neutral
          </div>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111111', letterSpacing: '-0.02em' }}>
            {data.negative_pct}%
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>
            Pressure
          </div>
        </div>
      </div>

      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 12, letterSpacing: '0.02em' }}>
        {directionLabel[data.arc_direction] ?? data.arc_direction}
      </p>
    </div>
  )
}
