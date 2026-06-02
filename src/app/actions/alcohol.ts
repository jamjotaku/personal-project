'use server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addAlcoholLog(formData: FormData) {
  const amountStr = formData.get('amount') as string
  const beverageType = formData.get('beverage_type') as string
  const notes = formData.get('notes') as string

  const amount = parseInt(amountStr, 10)
  if (isNaN(amount)) return { error: 'Invalid amount' }

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('alcohol_logs').insert({
    user_id: userData.user.id,
    amount_ml: amount,
    beverage_type: beverageType,
    notes: notes
  })

  if (error) return { error: error.message }
  
  revalidatePath('/alcohol')
  return { success: true }
}
