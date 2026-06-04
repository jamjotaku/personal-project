'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import * as cheerio from 'cheerio'

export async function createPost(formData: FormData) {
  const content = formData.get('content') as string
  if (!content) return;

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return;

  // タグの抽出 (例: #idea -> idea)
  const tagMatches = content.match(/#([^\s#]+)/g) || []
  const tags = tagMatches.map(t => t.slice(1))

  // URLかどうか判定
  const urlRegex = /(https?:\/\/[^\s]+)/
  const urlMatch = content.match(urlRegex)

  if (urlMatch) {
    const url = urlMatch[0]
    const twitterRegex = /https?:\/\/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/
    const twitterMatch = url.match(twitterRegex)

    if (twitterMatch) {
      // TwitterのURLが含まれている場合はvxtwitter APIを利用
      const username = twitterMatch[1]
      const tweetId = twitterMatch[2]
      
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
          image_url: imageUrl,
          tags: tags
        })
        if (dbError) throw dbError
      } catch (err: any) {
        console.log('Catch Error:', err.message)
        return;
      }
    } else {
      // 一般的なURLの場合、HTMLを取得してOGPを解析する
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'bot' } })
        if (!res.ok) throw new Error('Failed to fetch url')
        const html = await res.text()
        const $ = cheerio.load(html)
        
        const title = $('meta[property="og:title"]').attr('content') || $('title').text() || ''
        const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || ''
        const image = $('meta[property="og:image"]').attr('content') || ''
        const siteName = $('meta[property="og:site_name"]').attr('content') || ''

        const { error: dbError } = await supabase.from('bookmarks').insert({
          user_id: userData.user.id,
          original_url: url,
          content: content,
          title: title,
          description: description,
          image_url: image,
          site_name: siteName,
          tags: tags
        })
        if (dbError) throw dbError
      } catch (err: any) {
        console.log('Catch Error (OGP):', err.message)
        return;
      }
    }
  } else {
    // URLでない場合は壁打ちメモとして処理
    const { error: dbError } = await supabase.from('memos').insert({
      user_id: userData.user.id,
      content: content,
      tags: tags
    })
    if (dbError) return;
  }

  revalidatePath('/')
  revalidatePath('/bookmarks')
  revalidatePath('/memos')
}

export async function deletePost(id: string, isBookmark: boolean) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return;

  const table = isBookmark ? 'bookmarks' : 'memos';

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('user_id', userData.user.id);

  if (error) {
    console.log('Delete error:', error.message);
  }

  revalidatePath('/')
  revalidatePath('/bookmarks')
  revalidatePath('/memos')
  revalidatePath('/search')
}
