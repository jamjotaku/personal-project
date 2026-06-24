import { createClient } from '@/utils/supabase/server'
import { addMentalLog } from '@/app/actions/mental'
import MentalForm from './MentalForm'
import SpotifyWidget from './SpotifyWidget'
import DiscordPanel from '../ui/DiscordPanel'

export default async function RightSidebar() {
  const supabase = await createClient()
  
  // ユーザーがログインしているか確認
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 過去のメンタル記録を取得
  const { data: mentalLogs } = await supabase
    .from('mental_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(7)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      <DiscordPanel />

      <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '16px' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '1.1rem', fontWeight: 'bold' }}>今日のメンタル</h3>
        
        {/* メンタル入力フォーム */}
        <MentalForm action={addMentalLog} />

        <div style={{ display: 'flex', gap: '8px', height: '100px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          {[...(mentalLogs || [])].reverse().map((log) => (
            <div key={log.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', height: '100%' }}>
              <div style={{ width: '100%', background: 'var(--accent-color)', height: `${(log.level / 5) * 100}%`, borderRadius: '4px' }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{new Date(log.created_at).getDate()}d</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center' }}>1(不調) 〜 5(絶好調)</p>
      </div>

      <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '16px' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '1.1rem', fontWeight: 'bold' }}>再生中の音楽</h3>
        <SpotifyWidget />
      </div>
    </div>
  );
}
