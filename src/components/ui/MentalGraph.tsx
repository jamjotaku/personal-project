'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

type MentalLog = {
  id: number
  level: number
  created_at: string
}

export default function MentalGraph({ logs }: { logs: MentalLog[] }) {
  // 古い順にソートしてグラフ用データに成形
  const data = [...logs].reverse().map(log => {
    const d = new Date(log.created_at)
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      level: log.level,
      fullDate: d.toLocaleString()
    }
  })

  if (data.length === 0) {
    return <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '16px' }}>まだ記録がありません</div>
  }

  return (
    <div style={{ height: '150px', width: '100%', marginTop: '16px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
          <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis domain={[1, 5]} ticks={[1, 3, 5]} stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
            itemStyle={{ color: 'var(--accent-color)', fontWeight: 'bold' }}
            labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
          />
          <Line type="monotone" dataKey="level" stroke="var(--accent-color)" strokeWidth={3} dot={{ fill: 'var(--accent-color)', r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
