import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Last.fm API から現在再生中の曲を取得するヘルパー関数
async function getLastFmNowPlaying() {
  const lastfmUser = process.env.LASTFM_USERNAME;
  const lastfmApiKey = process.env.LASTFM_API_KEY;

  if (!lastfmUser || !lastfmApiKey) {
    return null;
  }

  try {
    const res = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfmUser}&api_key=${lastfmApiKey}&format=json&limit=1`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;

    const data = await res.json();
    const tracks = data?.recenttracks?.track;
    if (!tracks || tracks.length === 0) return null;

    const currentTrack = tracks[0];
    // @attr.nowplaying が "true" の場合のみ再生中と判定
    if (currentTrack['@attr']?.nowplaying === 'true') {
      const imageUrl = currentTrack.image?.find((img: any) => img.size === 'extralarge')?.['#text'] || 
                       currentTrack.image?.find((img: any) => img.size === 'large')?.['#text'] || '';
      return {
        isPlaying: true,
        title: currentTrack.name,
        artist: currentTrack.artist?.['#text'] || 'Unknown Artist',
        albumImageUrl: imageUrl,
        songUrl: currentTrack.url,
        source: 'lastfm'
      };
    }
    return null;
  } catch (error) {
    console.error('Last.fm fetch error:', error);
    return null;
  }
}

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

  let isSpotifyLinked = !!(settings && settings.spotify_refresh_token);
  let spotifyTrack = null;

  if (isSpotifyLinked) {
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
      if (!tokenData.error) {
        const accessToken = tokenData.access_token

        const playingRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'
        })

        if (playingRes.status === 200) {
          const playingData = await playingRes.json()
          if (playingData.item && playingData.is_playing) {
            spotifyTrack = {
              isPlaying: true,
              title: playingData.item.name,
              artist: playingData.item.artists.map((a: any) => a.name).join(', '),
              albumImageUrl: playingData.item.album.images[0]?.url,
              songUrl: playingData.item.external_urls.spotify,
              source: 'spotify'
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Spotify API Error:', error.message)
    }
  }

  // Spotifyで再生中ならそれを返す
  if (spotifyTrack) {
    return NextResponse.json(spotifyTrack)
  }

  // Spotifyが再生されていない、または連携されていない場合はLast.fmをチェック
  const lastfmTrack = await getLastFmNowPlaying();
  if (lastfmTrack) {
    return NextResponse.json(lastfmTrack);
  }

  // どちらも再生中でない場合
  return NextResponse.json({ 
    isPlaying: false, 
    notLinked: !isSpotifyLinked && !process.env.LASTFM_USERNAME 
  })
}
