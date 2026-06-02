import Link from 'next/link';

export default function BottomNav() {
  return (
    <nav style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
      <Link href="/">ホーム</Link>
      <Link href="/bookmarks">BM</Link>
      <Link href="/alcohol">飲酒</Link>
      <Link href="/memos">メモ</Link>
    </nav>
  );
}
