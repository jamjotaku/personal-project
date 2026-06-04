'use client';
import { useRouter } from 'next/navigation';

export default function SearchForm() {
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q');
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q.toString())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} style={{ display: 'flex' }}>
      <input 
        name="q"
        placeholder="検索" 
        style={{ 
          width: '100%', 
          padding: '12px 16px', 
          borderRadius: '9999px', 
          border: 'none', 
          background: 'var(--bg-secondary)', 
          color: 'var(--text-primary)',
          outline: 'none',
          fontSize: '1rem'
        }} 
      />
    </form>
  );
}
