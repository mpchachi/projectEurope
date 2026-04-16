import ReactECharts from 'echarts-for-react'
import type { SentimentArc as SentimentArcType } from '../../types'

const directionStatement: Record<string, string> = {
  warming:    'Confidence building through the session',
  cooling:    'Pressure increasing toward the end',
  consistent: 'Stable confidence throughout',
}

export default function SentimentArc({ data }: { data: SentimentArcType }) {
  if (!data.available || !data.data.length) {
    return (
      <div className="flex items-center justify-center h-32 text-[#6F6F78] text-sm">
        No sentiment data available
      </div>
    )
  }

  const points = data.data.map(p =>
    p.s === 'positive' ? 1 : p.s === 'negative' ? -1 : 0
  )

  const option = {
    backgroundColor: 'transparent',
    grid: { left: 0, right: 0, top: 4, bottom: 0 },
    xAxis: { type: 'category', show: false },
    yAxis: { type: 'value', min: -1.4, max: 1.4, show: false },
    series: [
      {
        type: 'line',
        data: points,
        smooth: 0.65,
        symbol: 'none',
        lineStyle: { width: 2.5, color: '#FE79AB' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0,   color: 'rgba(254,121,171,0.25)' },
              { offset: 1,   color: 'rgba(254,121,171,0.00)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#D9D9DE', type: 'dashed', width: 1 },
          data: [{ yAxis: 0 }],
        },
      },
    ],
    animation: true,
    animationDuration: 1200,
    animationEasing: 'cubicOut',
  }

  const statement = directionStatement[data.arc_direction] ?? data.arc_direction

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-6xl font-black text-[#FE79AB] leading-none tracking-tighter">
          {data.positive_pct}%
        </div>
        <p className="text-[#6F6F78] text-sm mt-1.5">{statement}</p>
      </div>
      <ReactECharts option={option} style={{ height: 80 }} />
    </div>
  )
}
