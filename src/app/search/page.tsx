import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PostItem from '@/components/ui/PostItem'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { q } = await searchParams;
  const query = q || ''

  // Supabaseでテキスト検索（今回は簡易的にilikeを使用、タグも検索対象）
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .or(`content.ilike.%${query}%,tags.cs.{${query}}`)
    .order('created_at', { ascending: false })
    .limit(30)

  const { data: memos } = await supabase
    .from('memos')
    .select('*')
    .eq('user_id', user.id)
    .or(`content.ilike.%${query}%,tags.cs.{${query}}`)
    .order('created_at', { ascending: false })
    .limit(30)

  const posts = [...(bookmarks || []), ...(memos || [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 30)

  return (
    <div>
      <header style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>検索: {query}</h1>
      </header>

      {/* Timeline Feed */}
      <div>
        {posts.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
        {posts.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            「{query}」に一致する投稿が見つかりませんでした。
          </div>
        )}
      </div>
    </div>
  );
}
