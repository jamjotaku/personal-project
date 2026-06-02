'use client'

import { useEffect, useState } from 'react'
import styles from './SpotifyWidget.module.css'

type TrackInfo = {
  isPlaying: boolean
  title?: string
  artist?: string
  albumImageUrl?: string
  songUrl?: string
  notLinked?: boolean
  error?: string
}

export default function SpotifyWidget() {
  const [track, setTrack] = useState<TrackInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchNowPlaying = async () => {
    try {
      const res = await fetch('/api/spotify/now-playing')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setTrack(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNowPlaying()
    const interval = setInterval(fetchNowPlaying, 15000) // 15秒ごとに更新
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <p className={styles.textSecondary}>読み込み中...</p>
  }

  if (track?.notLinked) {
    return (
      <div>
        <p className={styles.textSecondary} style={{ marginBottom: '12px' }}>未連携です</p>
        <a href="/api/auth/spotify" className={styles.linkButton}>Spotifyを連携する</a>
      </div>
    )
  }

  if (!track || !track.isPlaying) {
    return <p className={styles.textSecondary}>現在再生中の音楽はありません</p>
  }

  return (
    <a href={track.songUrl} target="_blank" rel="noopener noreferrer" className={styles.container}>
      {track.albumImageUrl && (
        <img src={track.albumImageUrl} alt="Album Art" className={styles.albumArt} />
      )}
      <div className={styles.info}>
        <p className={styles.title}>{track.title}</p>
        <p className={styles.artist}>{track.artist}</p>
        <div className={styles.equalizer}>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
        </div>
      </div>
    </a>
  )
}
