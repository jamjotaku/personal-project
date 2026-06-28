import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import * as cheerio from 'cheerio';

// APIキー認証ミドルウェア関数
function isAuthenticated(req: Request) {
  const authHeader = req.headers.get('authorization');
  const apiKey = process.env.API_SECRET_KEY;
  
  if (!apiKey) return true;
  return authHeader === `Bearer ${apiKey}`;
}

export async function GET(req: Request) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // 個人利用前提: API呼び出しでユーザーが取れない場合、DBの最初のユーザーIDを使う
    let userId = user?.id;
    if (!userId) {
      const { data: users } = await supabase.from('memos').select('user_id').limit(1);
      if (users && users.length > 0) {
        userId = users[0].user_id;
      } else {
        return NextResponse.json({ data: [] });
      }
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data: memos } = await supabase
      .from('memos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    const posts = [...(bookmarks || []), ...(memos || [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    return NextResponse.json({ data: posts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    let userId = user?.id;
    if (!userId) {
      const { data: users } = await supabase.from('memos').select('user_id').limit(1);
      if (users && users.length > 0) {
        userId = users[0].user_id;
      } else {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    const tagMatches = content.match(/#([^\s#]+)/g) || [];
    const tags = tagMatches.map((t: string) => t.slice(1));
    const urlRegex = /(https?:\/\/[^\s]+)/;
    const urlMatch = content.match(urlRegex);

    if (urlMatch) {
      const url = urlMatch[0];
      const twitterRegex = /https?:\/\/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/;
      const twitterMatch = url.match(twitterRegex);

      if (twitterMatch) {
        const username = twitterMatch[1];
        const tweetId = twitterMatch[2];
        
        const res = await fetch(`https://api.vxtwitter.com/${username}/status/${tweetId}`);
        if (res.ok) {
          const data = await res.json();
          const imageUrl = (data.mediaURLs && data.mediaURLs.length > 0) ? data.mediaURLs[0] : '';
          
          const { error: dbError } = await supabase.from('bookmarks').insert({
            user_id: userId,
            original_url: url,
            fxtwitter_url: `https://fxtwitter.com/${username}/status/${tweetId}`,
            author_name: data.user_name || '',
            author_handle: data.user_screen_name || username,
            author_icon_url: data.user_profile_image_url || '',
            content: data.text || '',
            image_url: imageUrl,
            tags: tags
          });
          if (dbError) throw dbError;
          return NextResponse.json({ success: true, type: 'twitter_bookmark' });
        }
      }

      const res = await fetch(url, { headers: { 'User-Agent': 'bot' } });
      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);
        
        const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
        const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
        const image = $('meta[property="og:image"]').attr('content') || '';
        const siteName = $('meta[property="og:site_name"]').attr('content') || '';

        const { error: dbError } = await supabase.from('bookmarks').insert({
          user_id: userId,
          original_url: url,
          content: content,
          title: title,
          description: description,
          image_url: image,
          site_name: siteName,
          tags: tags
        });
        if (dbError) throw dbError;
        return NextResponse.json({ success: true, type: 'bookmark' });
      }
    }

    const { error: dbError } = await supabase.from('memos').insert({
      user_id: userId,
      content: content,
      tags: tags
    });
    if (dbError) throw dbError;

    return NextResponse.json({ success: true, type: 'memo' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
