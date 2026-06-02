'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const content = formData.get('content') as string
  console.log('--- createPost called ---')
  console.log('Content length:', content?.length)
  if (!content) return;

  const supabase = await createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  console.log('Auth user ID:', userData.user?.id)
  console.log('Auth error:', authError?.message)
  
  if (!userData.user) return;

  // URLかどうか、特にTwitter(X)のURLか判定
  const twitterRegex = /https?:\/\/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/
  const match = content.match(twitterRegex)

  if (match) {
    // TwitterのURLが含まれている場合はブックマークとして処理
    const username = match[1]
    const tweetId = match[2]
    const url = match[0]
    
    try {
      const res = await fetch(`https://api.vxtwitter.com/${username}/status/${tweetId}`)
      if (!res.ok) throw new Error('Failed to fetch tweet')
      const data = await res.json()

      const authorName = data.user_name || ''
      const authorHandle = data.user_screen_name || username
      const authorIconUrl = data.user_profile_image_url || ''
      const tweetText = data.text || ''
      let imageUrl = ''
      if (data.mediaURLs && data.mediaURLs.length > 0) {
        imageUrl = data.mediaURLs[0]
      }

      const { error: dbError } = await supabase.from('bookmarks').insert({
        user_id: userData.user.id,
        original_url: url,
        fxtwitter_url: `https://fxtwitter.com/${username}/status/${tweetId}`,
        author_name: authorName,
        author_handle: authorHandle,
        author_icon_url: authorIconUrl,
        content: tweetText,
        image_url: imageUrl
      })
      if (dbError) {
        console.log('DB Insert Error (Bookmark):', dbError.message)
        throw dbError
      }
    } catch (err: any) {
      console.log('Catch Error:', err.message)
      return;
    }
  } else {
    // URLでない場合は壁打ちメモとして処理
    const { error: dbError } = await supabase.from('memos').insert({
      user_id: userData.user.id,
      content: content
    })
    if (dbError) {
      console.log('DB Insert Error (Memo):', dbError.message)
      return;
    }
  }

  console.log('--- createPost Success ---')
  revalidatePath('/')
}
