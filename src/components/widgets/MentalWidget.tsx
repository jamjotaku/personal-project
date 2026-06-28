import { createClient } from '@/utils/supabase/server'
import { addMentalLog } from '@/app/actions/mental'
import MentalForm from '../layout/MentalForm'
import MentalGraph from '../ui/MentalGraph'

export default async function MentalWidget() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: mentalLogs } = await supabase
    .from('mental_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(7)

  return (
    <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '16px' }}>
      <h3 style={{ marginBottom: '12px', fontSize: '1.1rem', fontWeight: 'bold' }}>今日のメンタル</h3>
      <MentalForm action={addMentalLog} />
      <MentalGraph logs={mentalLogs || []} />
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center' }}>1(不調) 〜 5(絶好調)</p>
    </div>
  )
}
