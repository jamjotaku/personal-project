import styles from './Widget.module.css'

async function getWeatherData() {
  // Chiba coordinates
  const lat = 35.6047
  const lon = 140.1233
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=Asia%2FTokyo`
  
  try {
    const res = await fetch(url, { next: { revalidate: 1800 } }) // Cache for 30 mins
    if (!res.ok) throw new Error('Failed to fetch weather')
    return res.json()
  } catch (error) {
    console.error(error)
    return null
  }
}

// Map WMO weather codes to emojis and descriptions
function getWeatherCondition(code: number) {
  if (code === 0) return { emoji: '☀️', text: '快晴' }
  if (code === 1 || code === 2 || code === 3) return { emoji: '⛅', text: '晴れ/曇り' }
  if (code >= 45 && code <= 48) return { emoji: '🌫️', text: '霧' }
  if (code >= 51 && code <= 55) return { emoji: '🌧️', text: '霧雨' }
  if (code >= 61 && code <= 65) return { emoji: '☔', text: '雨' }
  if (code >= 71 && code <= 77) return { emoji: '❄️', text: '雪' }
  if (code >= 80 && code <= 82) return { emoji: '🌧️', text: 'にわか雨' }
  if (code >= 95) return { emoji: '⛈️', text: '雷雨' }
  return { emoji: '☁️', text: '不明' }
}

export default async function WeatherWidget() {
  const data = await getWeatherData()

  if (!data || !data.current_weather) {
    return (
      <div className={styles.widgetCard}>
        <h3>🌤️ 千葉の天気</h3>
        <p style={{ color: 'var(--text-secondary)' }}>データの取得に失敗しました</p>
      </div>
    )
  }

  const { temperature, weathercode } = data.current_weather
  const condition = getWeatherCondition(weathercode)

  return (
    <div className={styles.widgetCard}>
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>千葉のお天気</span>
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '3rem' }}>{condition.emoji}</span>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{condition.text}</div>
            <div style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>{temperature}°C</div>
          </div>
        </div>
      </div>
    </div>
  )
}
