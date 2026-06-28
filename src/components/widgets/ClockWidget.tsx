'use client'

import { useState, useEffect } from 'react'
import styles from './Widget.module.css'

export default function ClockWidget() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!time) {
    return <div className={styles.widgetCard}>Loading clock...</div>
  }

  const timeString = time.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const dateString = time.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  return (
    <div className={styles.widgetCard} style={{ textAlign: 'center', padding: '24px' }}>
      <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
        {dateString}
      </div>
      <div style={{ fontSize: '3rem', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--primary)' }}>
        {timeString}
      </div>
    </div>
  )
}
