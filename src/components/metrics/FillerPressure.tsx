import ReactECharts from 'echarts-for-react'
import type { FillerPressure as FillerPressureType } from '../../types'

export default function FillerPressure({ data }: { data: FillerPressureType }) {
  const entries = Object.entries(data.by_topic ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)

  if (!entries.length) {
    return (
      <div className="flex items-center justify-center h-32 text-[#6F6F78] text-sm">
        No filler data available
      </div>
    )
  }

  const max = Math.max(...entries.map(([, v]) => v))

  const option = {
    backgroundColor: 'transparent',
    grid: { left: 8, right: 40, top: 4, bottom: 0, containLabel: true },
    xAxis: {
      type: 'value',
      show: false,
      max: max * 1.25,
    },
    yAxis: {
      type: 'category',
      data: entries.map(([t]) => t.length > 22 ? t.slice(0, 22) + '…' : t),
      axisLabel: { color: '#6F6F78', fontSize: 12, fontWeight: 500 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: entries.map(([, v]) => v),
      barMaxWidth: 32,
      itemStyle: {
        borderRadius: [0, 8, 8, 0],
        color: '#FE79AB',
      },
      label: {
        show: true,
        position: 'right',
        color: '#121114',
        fontSize: 12,
        fontWeight: 'bold',
        formatter: (p: { value: number }) => String(p.value),
      },
      emphasis: {
        itemStyle: { color: '#121114' },
      },
    }],
    animation: true,
    animationDuration: 800,
    animationEasing: 'cubicOut',
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end gap-3">
        <span className="text-6xl font-black text-[#121114] leading-none tracking-tighter">{data.total}</span>
        <span className="text-[#6F6F78] text-sm pb-1.5">total fillers</span>
      </div>
      <ReactECharts option={option} style={{ height: Math.max(entries.length * 44, 140) }} />
      {data.worst_topic && (
        <p className="text-xs text-[#6F6F78]">
          Worst topic: <span className="text-[#FE79AB] font-semibold">{data.worst_topic}</span>
        </p>
      )}
    </div>
  )
}
