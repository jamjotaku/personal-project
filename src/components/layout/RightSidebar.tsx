import DiscordPanel from '../ui/DiscordPanel'
import MentalWidget from '../widgets/MentalWidget'
import MusicWidget from '../widgets/MusicWidget'

export default async function RightSidebar() {
  // 将来的にはここをユーザーのDB設定から取得するように拡張可能
  const activeWidgets = [
    { id: 'discord', component: <DiscordPanel /> },
    { id: 'mental', component: <MentalWidget /> },
    { id: 'music', component: <MusicWidget /> },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {activeWidgets.map((widget) => (
        <div key={widget.id}>
          {widget.component}
        </div>
      ))}
    </div>
  );
}
