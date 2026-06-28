'use client'

import { useState, useEffect } from 'react'
import styles from './Widget.module.css'

export default function StickyNoteWidget() {
  const [note, setNote] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sticky_note')
    if (saved) {
      setNote(saved)
    }
    setIsLoaded(true)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setNote(val)
    localStorage.setItem('sticky_note', val)
  }

  if (!isLoaded) {
    return <div className={styles.widgetCard}>Loading...</div>
  }

  return (
    <div className={styles.widgetCard} style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <h3 style={{ marginBottom: '8px', fontSize: '1rem', color: 'var(--text-secondary)' }}>📝 クイック付箋</h3>
      <textarea
        value={note}
        onChange={handleChange}
        placeholder="一時的なメモをここに書けます..."
        style={{
          width: '100%',
          minHeight: '120px',
          backgroundColor: 'transparent',
          border: 'none',
          color: 'var(--text-primary)',
          fontSize: '0.9rem',
          resize: 'vertical',
          outline: 'none',
          lineHeight: '1.5'
        }}
      />
    </div>
  )
}
