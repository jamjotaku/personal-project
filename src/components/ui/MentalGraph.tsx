'use client'

import { useState, useEffect } from 'react'

type MentalLog = {
  id: number
  level: number
  created_at: string
}

export default function MentalGraph({ logs }: { logs: MentalLog[] }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div style={{ height: '100px', marginTop: '16px' }}>Loading...</div>
  }

  if (!logs || logs.length === 0) {
    return <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '16px' }}>まだ記録がありません</div>
  }

  // 古い順にソート（左から右へ時系列が進むように）
  const sortedLogs = [...logs].reverse()

  return (
    <div style={{ display: 'flex', gap: '8px', height: '100px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginTop: '16px' }}>
      {sortedLogs.map((log) => {
        const date = new Date(log.created_at)
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
        return (
          <div key={log.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', height: '100%' }}>
            <div 
              title={`${dateStr} - スコア: ${log.level}`}
              style={{ 
                width: '100%', 
                background: 'var(--accent-color)', 
                height: `${(log.level / 5) * 100}%`, 
                borderRadius: '4px',
                transition: 'height 0.3s ease'
              }} 
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{date.getDate()}</span>
          </div>
        )
      })}
    </div>
  )
}
