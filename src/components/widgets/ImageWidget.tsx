'use client'

import { useState, useEffect } from 'react'
import styles from './Widget.module.css'

export default function ImageWidget() {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('custom_image_url')
    if (saved) {
      setImageUrl(saved)
    } else {
      // デフォルトはUnsplashのランダムな美しい風景画像
      setImageUrl('https://source.unsplash.com/random/400x300/?landscape,nature')
    }
    setIsLoaded(true)
  }, [])

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const url = fd.get('url') as string
    
    if (url) {
      setImageUrl(url)
      localStorage.setItem('custom_image_url', url)
    } else {
      // 空ならデフォルトに戻す
      const defaultUrl = 'https://source.unsplash.com/random/400x300/?landscape,nature'
      setImageUrl(defaultUrl)
      localStorage.removeItem('custom_image_url')
    }
    setIsEditing(false)
  }

  if (!isLoaded) {
    return <div className={styles.widgetCard}>Loading image...</div>
  }

  return (
    <div className={styles.widgetCard} style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
      {isEditing ? (
        <div style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>画像URLの変更</h3>
          <form onSubmit={handleSave}>
            <input 
              name="url" 
              type="text" 
              defaultValue={localStorage.getItem('custom_image_url') || ''} 
              placeholder="https://..."
              style={{
                width: '100%', padding: '8px', marginBottom: '8px',
                backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', borderRadius: '4px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" style={{ padding: '4px 8px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>保存</button>
              <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '4px 8px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}>キャンセル</button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div style={{ width: '100%', height: '200px', backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <button 
            onClick={() => setIsEditing(true)}
            style={{
              position: 'absolute', top: '8px', right: '8px',
              background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none',
              borderRadius: '50%', width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '0.8rem'
            }}
            title="画像を変更"
          >
            ⚙️
          </button>
        </>
      )}
    </div>
  )
}
