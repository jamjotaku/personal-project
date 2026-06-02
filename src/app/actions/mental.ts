'use server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addMentalLog(formData: FormData) {
  const level = parseInt(formData.get('level') as string, 10)
  
  if (isNaN(level) || level < 1 || level > 5) return;

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return;

  const { error } = await supabase.from('mental_logs').insert({
    user_id: userData.user.id,
    level: level
  })

  if (error) return;
  
  revalidatePath('/')
}
