import Link from 'next/link';
import { deletePost } from '@/app/actions/posts';

export default function PostItem({ post }: { post: any }) {
  const isBookmark = 'original_url' in post;
  
  // URLやタグをリンク化する関数
  const renderContent = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(#\S+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        const tag = part.slice(1);
        return <Link key={i} href={`/search?q=${tag}`} style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>{part}</Link>;
      }
      return part;
    });
  };

  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  const youtubeId = isBookmark ? getYouTubeId(post.original_url) : null;

  return (
    <article style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)', flexShrink: 0, overflow: 'hidden' }}>
        {isBookmark && post.author_icon_url ? (
          <img src={post.author_icon_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : null}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 'bold' }}>
              {isBookmark ? (post.author_name || 'あなた') : 'あなた'}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {isBookmark && post.author_handle ? `@${post.author_handle}` : '@myself'} · {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
          <form action={deletePost.bind(null, post.id, isBookmark)}>
            <button type="submit" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', padding: '4px' }}>
              削除
            </button>
          </form>
        </div>
        
        <p style={{ marginTop: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {renderContent(post.content)}
        </p>

        {/* YouTube Video Player */}
        {youtubeId && (
          <div style={{ marginTop: '12px', borderRadius: '16px', overflow: 'hidden', position: 'relative', paddingTop: '56.25%' }}>
            <iframe 
              src={`https://www.youtube.com/embed/${youtubeId}`} 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allowFullScreen 
            />
          </div>
        )}

        {/* Twitter OGP (画像のみ) */}
        {isBookmark && post.image_url && !post.title && !youtubeId && (
          <div style={{ marginTop: '12px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <img src={post.image_url} alt="Media" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
        )}

        {/* General OGP Card */}
        {isBookmark && post.title && !youtubeId && (
          <a href={post.original_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ marginTop: '12px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
              {post.image_url && (
                <img src={post.image_url} alt="" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderBottom: '1px solid var(--border-color)' }} />
              )}
              <div style={{ padding: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.title}
                </h4>
                {post.description && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.description}
                  </p>
                )}
                {post.site_name && (
                  <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {post.site_name}
                  </div>
                )}
              </div>
            </div>
          </a>
        )}

        {/* URL Link */}
        {isBookmark && (
          <div style={{ marginTop: '8px' }}>
            <a href={post.original_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', color: 'var(--accent-color)' }}>
              {post.title ? '元のページを開く' : '元のツイートを開く'}
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
