import { createClient } from '@/utils/supabase/server'
import { createPost } from '@/app/actions/posts'
import { redirect } from 'next/navigation'

export default async function BookmarksPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // ブックマークのみ取得
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <div>
      <header style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>ブックマーク</h1>
      </header>
      
      {/* Post Box */}
      <form action={createPost} style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)' }} />
        <div style={{ flex: 1 }}>
          <textarea 
            name="content"
            required
            placeholder="Twitter(X)のURLを貼り付けてブックマーク" 
            style={{ width: '100%', background: 'transparent', border: 'none', resize: 'none', color: 'var(--text-primary)', fontSize: '1.25rem', outline: 'none', minHeight: '60px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="submit" style={{ background: 'var(--accent-color)', color: 'white', padding: '8px 16px', borderRadius: '9999px', fontWeight: 'bold' }}>
              保存する
            </button>
          </div>
        </div>
      </form>

      {/* Timeline Feed */}
      <div>
        {bookmarks?.map((post) => (
          <article key={post.id} style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)', flexShrink: 0, overflow: 'hidden' }}>
              {post.author_icon_url && (
                <img src={post.author_icon_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 'bold' }}>
                  {post.author_name}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  @{post.author_handle} · {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <p style={{ marginTop: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {post.content}
              </p>

              {post.image_url && (
                <div style={{ marginTop: '12px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={post.image_url} alt="Tweet media" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
              )}
              
              <div style={{ marginTop: '8px' }}>
                <a href={post.original_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem' }}>
                  元のツイートを開く
                </a>
              </div>
            </div>
          </article>
        ))}
        {(!bookmarks || bookmarks.length === 0) && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            まだブックマークがありません。
          </div>
        )}
      </div>
    </div>
  );
}
