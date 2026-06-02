import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/spotify'
  
  if (!clientId) {
    return NextResponse.json({ error: 'Spotify Client ID is not configured. Please add it to .env.local' }, { status: 500 })
  }

  const scope = 'user-read-currently-playing'
  const state = Math.random().toString(36).substring(7)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scope,
    redirect_uri: redirectUri,
    state: state
  })

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`)
}
