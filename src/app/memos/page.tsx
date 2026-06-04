import { createClient } from '@/utils/supabase/server'
import { createPost } from '@/app/actions/posts'
import { redirect } from 'next/navigation'
import PostItem from '@/components/ui/PostItem'

export default async function MemosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // メモのみ取得
  const { data: memos } = await supabase
    .from('memos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <div>
      <header style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>壁打ちメモ</h1>
      </header>
      
      {/* Post Box */}
      <form action={createPost} style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)' }} />
        <div style={{ flex: 1 }}>
          <textarea 
            name="content"
            required
            placeholder="いまどうしてる？（メモのみ表示）" 
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
        {memos?.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
        {(!memos || memos.length === 0) && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            まだメモがありません。
          </div>
        )}
      </div>
    </div>
  );
}
