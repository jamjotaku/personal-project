import { createClient } from '@/utils/supabase/server'
import { createPost } from './actions/posts'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // ブックマークとメモを両方取得
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: memos } = await supabase
    .from('memos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  // タイムライン用にマージして日付順にソート
  const posts = [...(bookmarks || []), ...(memos || [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 30)

  return (
    <div>
      <header style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>ホーム</h1>
      </header>
      
      {/* Post Box */}
      <form action={createPost} style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)' }} />
        <div style={{ flex: 1 }}>
          <textarea 
            name="content"
            required
            placeholder="いまどうしてる？（メモやURLを貼り付け）" 
            style={{ width: '100%', background: 'transparent', border: 'none', resize: 'none', color: 'var(--text-primary)', fontSize: '1.25rem', outline: 'none', minHeight: '60px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="submit" style={{ background: 'var(--accent-color)', color: 'white', padding: '8px 16px', borderRadius: '9999px', fontWeight: 'bold' }}>
              投稿する
            </button>
          </div>
        </div>
      </form>

      {/* Timeline Feed */}
      <div>
        {posts.map((post) => {
          const isBookmark = 'original_url' in post;
          return (
            <article key={post.id} style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)', flexShrink: 0, overflow: 'hidden' }}>
                {isBookmark && post.author_icon_url && (
                  <img src={post.author_icon_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 'bold' }}>
                    {isBookmark ? post.author_name : 'あなた'}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {isBookmark ? `@${post.author_handle}` : '@myself'} · {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <p style={{ marginTop: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {post.content}
                </p>

                {isBookmark && post.image_url && (
                  <div style={{ marginTop: '12px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img src={post.image_url} alt="Tweet media" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                )}
                {isBookmark && (
                  <div style={{ marginTop: '8px' }}>
                    <a href={post.original_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem' }}>
                      元のツイートを開く
                    </a>
                  </div>
                )}
              </div>
            </article>
          );
        })}
        {posts.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            まだ投稿がありません。URLやメモを投稿してみましょう！
          </div>
        )}
      </div>
    </div>
  );
}
