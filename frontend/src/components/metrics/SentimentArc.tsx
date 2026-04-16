import ReactECharts from 'echarts-for-react'
import type { SentimentArc as SentimentArcType } from '../../types'

const directionLabel: Record<string, string> = {
  warming:    '↑ Confidence building through session',
  cooling:    '↓ Pressure increasing toward end',
  consistent: '→ Consistent emotional tone',
}

export default function SentimentArc({ data }: { data: SentimentArcType }) {
  if (!data.available || !data.data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-[#6F6F78] text-sm">
        No sentiment data available
      </div>
    )
  }

  const points = data.data.map(p =>
    p.s === 'positive' ? 1 : p.s === 'negative' ? -1 : 0
  )

  const option = {
    backgroundColor: 'transparent',
    grid: { left: 0, right: 0, top: 8, bottom: 0 },
    xAxis: { type: 'category', show: false },
    yAxis: { type: 'value', min: -1.4, max: 1.4, show: false },
    series: [
      {
        type: 'line',
        data: points,
        smooth: 0.65,
        symbol: 'none',
        lineStyle: { width: 3, color: '#FE79AB' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0,   color: 'rgba(254,121,171,0.30)' },
              { offset: 0.7, color: 'rgba(254,121,171,0.06)' },
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

  return (
    <div className="flex flex-col gap-4">
      <ReactECharts option={option} style={{ height: 130 }} />

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl p-3" style={{ background: 'rgba(254,121,171,0.08)' }}>
          <div className="font-black text-2xl text-[#FE79AB] leading-none">{data.positive_pct}%</div>
          <div className="text-[#6F6F78] mt-1">Confident</div>
        </div>
        <div className="rounded-xl p-3 bg-[#EFEFF1]">
          <div className="font-black text-2xl text-[#121114] leading-none">{data.neutral_pct}%</div>
          <div className="text-[#6F6F78] mt-1">Neutral</div>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.07)' }}>
          <div className="font-black text-2xl text-[#EF4444] leading-none">{data.negative_pct}%</div>
          <div className="text-[#6F6F78] mt-1">Pressure</div>
        </div>
      </div>

      <p className="text-xs text-[#6F6F78] text-center">
        {directionLabel[data.arc_direction] ?? data.arc_direction}
      </p>
    </div>
  )
}
