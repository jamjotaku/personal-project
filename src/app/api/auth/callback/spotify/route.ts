import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  
  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/spotify'

  const authOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
    },
    body: new URLSearchParams({
      code: code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  }

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', authOptions)
    const data = await res.json()

    if (data.error) {
      throw new Error(data.error_description || data.error)
    }

    const refreshToken = data.refresh_token

    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    
    if (userData.user && refreshToken) {
      // Upsert user_settings
      await supabase.from('user_settings').upsert({
        user_id: userData.user.id,
        spotify_refresh_token: refreshToken,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
    }

    return NextResponse.redirect(new URL('/', request.url))
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
