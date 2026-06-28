import SpotifyWidget from '../layout/SpotifyWidget'

export default function MusicWidget() {
  return (
    <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '16px' }}>
      <h3 style={{ marginBottom: '12px', fontSize: '1.1rem', fontWeight: 'bold' }}>再生中の音楽</h3>
      <SpotifyWidget />
    </div>
  )
}
