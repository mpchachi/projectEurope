import ReactECharts from 'echarts-for-react'
import { motion } from 'framer-motion'
import type { GrayZones as GrayZonesType } from '../../types'

export default function GrayZones({ data }: { data: GrayZonesType }) {
  const avoided = data.avoided ?? []

  if (!avoided.length) {
    return (
      <div className="flex items-center justify-center h-32 text-[#6F6F78] text-sm">
        No avoidance patterns detected
      </div>
    )
  }

  const indicators = avoided.map(z => ({ name: z.structure, max: 10 }))
  const values = avoided.map(() => 8)

  const option = {
    backgroundColor: 'transparent',
    radar: {
      indicator: indicators,
      radius: '65%',
      axisName: { color: '#6F6F78', fontSize: 11, fontWeight: 500 },
      splitLine: { lineStyle: { color: '#EFEFF1', width: 1 } },
      splitArea: { areaStyle: { color: ['rgba(254,121,171,0.04)', 'rgba(254,121,171,0.01)'] } },
      axisLine: { lineStyle: { color: '#EFEFF1' } },
    },
    series: [{
      type: 'radar',
      data: [{ value: values, name: 'Avoided structures' }],
      areaStyle: { color: 'rgba(239,68,68,0.09)' },
      lineStyle: { color: '#EF4444', width: 2.5 },
      itemStyle: { color: '#EF4444' },
      symbol: 'circle',
      symbolSize: 5,
    }],
    animation: true,
    animationDuration: 1000,
  }

  return (
    <div className="flex flex-col gap-4">
      {avoided.length >= 3 && (
        <ReactECharts option={option} style={{ height: 190 }} />
      )}

      <div className="flex flex-col gap-2">
        {avoided.map((z, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl p-3"
            style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}
          >
            <span className="text-[#EF4444] text-xs font-semibold uppercase tracking-wider">
              {z.structure}
            </span>
            <p className="text-[#6F6F78] text-xs leading-relaxed mt-1">
              <span className="text-[#121114] font-medium">Expected: </span>{z.expected_because}
            </p>
            {z.evidence && (
              <p className="text-[#6F6F78] text-xs mt-1 italic opacity-70">"{z.evidence}"</p>
            )}
          </motion.div>
        ))}
      </div>

      {data.verdict && (
        <p className="text-xs text-[#6F6F78] border-t border-[#D9D9DE] pt-3">{data.verdict}</p>
      )}
    </div>
  )
}
