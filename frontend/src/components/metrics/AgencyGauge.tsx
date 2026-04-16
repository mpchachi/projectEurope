import GaugeComponent from 'react-gauge-component'
import { motion } from 'framer-motion'
import type { Agency } from '../../types'

const statusLabel: Record<string, { label: string; color: string }> = {
  reactive:   { label: 'Passenger — waits to be asked', color: '#EF4444' },
  developing: { label: 'Developing independence',       color: '#6F6F78' },
  proactive:  { label: 'Driver — owns the conversation', color: '#34D399' },
}

export default function AgencyGauge({ data }: { data: Agency }) {
  const st = statusLabel[data.status] ?? statusLabel.developing

  return (
    <div className="flex flex-col items-center gap-3">
      <GaugeComponent
        value={data.score}
        minValue={0}
        maxValue={10}
        type="radial"
        arc={{
          colorArray: ['#EF4444', '#6F6F78', '#34D399'],
          padding: 0.02,
          width: 0.25,
          subArcs: [{ limit: 3 }, { limit: 6 }, { limit: 10 }],
        }}
        pointer={{ type: 'needle', color: '#121114', length: 0.7, width: 10 }}
        labels={{
          valueLabel: {
            formatTextValue: v => `${v.toFixed(1)}`,
            style: { fill: '#121114', fontSize: '28px', fontWeight: 'bold' },
          },
          tickLabels: {
            type: 'outer',
            ticks: [{ value: 0 }, { value: 5 }, { value: 10 }],
            defaultTickValueConfig: { style: { fill: '#6F6F78', fontSize: '11px' } },
          },
        }}
        style={{ width: '100%', maxWidth: 220 }}
      />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-sm font-semibold"
        style={{ color: st.color }}
      >
        {st.label}
      </motion.p>

      <div className="grid grid-cols-2 gap-2 w-full text-center text-xs">
        <div className="rounded-xl p-3 bg-[#F3F3F4]">
          <div className="text-[#121114] font-black text-xl">{data.initiations}</div>
          <div className="text-[#6F6F78] mt-0.5">Initiations</div>
        </div>
        <div className="rounded-xl p-3 bg-[#F3F3F4]">
          <div className="text-[#121114] font-black text-xl">{data.responses}</div>
          <div className="text-[#6F6F78] mt-0.5">Responses</div>
        </div>
      </div>

      <p className="text-xs text-[#6F6F78]">{data.pct.toFixed(0)}% student-initiated</p>
    </div>
  )
}
