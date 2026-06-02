import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  
  if (!userData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: settings } = await supabase
    .from('user_settings')
    .select('spotify_refresh_token')
    .eq('user_id', userData.user.id)
    .single()

  if (!settings || !settings.spotify_refresh_token) {
    return NextResponse.json({ isPlaying: false, notLinked: true })
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!

  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: settings.spotify_refresh_token
      }),
      cache: 'no-store'
    })

    const tokenData = await tokenRes.json()
    if (tokenData.error) throw new Error(tokenData.error)

    const accessToken = tokenData.access_token

    const playingRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      cache: 'no-store'
    })

    if (playingRes.status === 204 || playingRes.status > 400) {
      return NextResponse.json({ isPlaying: false })
    }

    const playingData = await playingRes.json()

    if (!playingData.item) {
      return NextResponse.json({ isPlaying: false })
    }

    const track = {
      isPlaying: playingData.is_playing,
      title: playingData.item.name,
      artist: playingData.item.artists.map((a: any) => a.name).join(', '),
      albumImageUrl: playingData.item.album.images[0]?.url,
      songUrl: playingData.item.external_urls.spotify
    }

    return NextResponse.json(track)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
