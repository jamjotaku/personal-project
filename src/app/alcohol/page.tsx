import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { addAlcoholLog } from '../actions/alcohol'

export default async function AlcoholPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: logs } = await supabase
    .from('alcohol_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)

  // 日本時間での「今日」を計算
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const today = jstNow.toISOString().split('T')[0]

  const todayTotal = (logs || []).filter(log => {
    const d = new Date(log.created_at)
    const jstD = new Date(d.getTime() + 9 * 60 * 60 * 1000)
    return jstD.toISOString().split('T')[0] === today
  }).reduce((sum, log) => sum + log.amount_ml, 0)

  return (
    <div>
      <header style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, backdropFilter: 'blur(12px)', zIndex: 10 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>飲酒記録</h1>
      </header>

      <div style={{ padding: '16px' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>今日の飲酒量</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{todayTotal} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>ml</span></p>
        </div>

        <form action={addAlcoholLog} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '16px' }}>
          <h2 style={{ fontWeight: 'bold' }}>記録を追加</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input type="number" name="amount" required placeholder="量 (ml)" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
            <input type="text" name="beverage_type" required placeholder="種類 (ビール等)" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
          </div>
          <input type="text" name="notes" placeholder="メモ（任意）" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
          <button type="submit" style={{ background: 'var(--accent-color)', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>記録する</button>
        </form>

        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '16px' }}>履歴</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {logs?.map(log => (
              <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontWeight: 'bold' }}>{log.beverage_type}</span>
                  {log.notes && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>{log.notes}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>{log.amount_ml} ml</span>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>{new Date(log.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
