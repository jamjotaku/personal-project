import { cookies } from 'next/headers'
import DiscordPanel from '../ui/DiscordPanel'
import MentalWidget from '../widgets/MentalWidget'
import MusicWidget from '../widgets/MusicWidget'
import ClockWidget from '../widgets/ClockWidget'
import WeatherWidget from '../widgets/WeatherWidget'
import CountdownWidget from '../widgets/CountdownWidget'
import StickyNoteWidget from '../widgets/StickyNoteWidget'
import ImageWidget from '../widgets/ImageWidget'

const widgetRegistry: Record<string, React.ReactNode> = {
  discord: <DiscordPanel />,
  mental: <MentalWidget />,
  music: <MusicWidget />,
  clock: <ClockWidget />,
  weather: <WeatherWidget />,
  countdown: <CountdownWidget />,
  stickynote: <StickyNoteWidget />,
  image: <ImageWidget />,
}

const defaultWidgets = ['clock', 'weather', 'countdown', 'stickynote', 'image', 'mental', 'music', 'discord']

export default async function RightSidebar() {
  const cookieStore = await cookies()
  const saved = cookieStore.get('active_widgets')?.value
  
  let activeWidgetIds = defaultWidgets
  if (saved) {
    try {
      activeWidgetIds = JSON.parse(saved)
    } catch {
      // parse error
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {activeWidgetIds.map((id) => {
        const component = widgetRegistry[id]
        if (!component) return null
        return (
          <div key={id}>
            {component}
          </div>
        )
      })}
    </div>
  );
}
