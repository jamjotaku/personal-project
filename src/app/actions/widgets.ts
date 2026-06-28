'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function saveWidgetSettings(activeWidgets: string[]) {
  const cookieStore = await cookies()
  cookieStore.set('active_widgets', JSON.stringify(activeWidgets), {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })
  
  // Update UI immediately
  revalidatePath('/')
  revalidatePath('/settings')
}
