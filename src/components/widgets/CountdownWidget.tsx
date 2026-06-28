'use client'

import { useState, useEffect } from 'react'
import styles from './Widget.module.css'

export default function CountdownWidget() {
  // ターゲット日付を設定（例：夏の旅行 8/19）
  const targetDate = new Date('2026-08-19T00:00:00')
  const eventName = '夏の旅行'

  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    const calculateDays = () => {
      const now = new Date()
      const diffTime = targetDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setDaysLeft(diffDays)
    }
    
    calculateDays()
    // 1日ごとに更新するタイマーをセットしても良いが、マウント時のみで十分
  }, [targetDate])

  if (daysLeft === null) {
    return <div className={styles.widgetCard}>Loading...</div>
  }

  return (
    <div className={styles.widgetCard} style={{ textAlign: 'center' }}>
      <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>{eventName}まで</h3>
      {daysLeft > 0 ? (
        <div style={{ fontSize: '1.2rem' }}>
          あと <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)' }}>{daysLeft}</span> 日
        </div>
      ) : daysLeft === 0 ? (
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
          🎉 今日が当日です！ 🎉
        </div>
      ) : (
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
          終了しました
        </div>
      )}
    </div>
  )
}
