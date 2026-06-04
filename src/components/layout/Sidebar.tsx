import Link from 'next/link';
import styles from './Sidebar.module.css';
import SearchForm from './SearchForm';

export default function Sidebar() {
  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <Link href="/">
          <h2>ポータル</h2>
        </Link>
      </div>
      <div style={{ padding: '0 12px 16px' }}>
        <SearchForm />
      </div>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navItem}>ホーム</Link>
        <Link href="/bookmarks" className={styles.navItem}>ブックマーク</Link>
        <Link href="/alcohol" className={styles.navItem}>飲酒記録</Link>
        <Link href="/memos" className={styles.navItem}>壁打ちメモ</Link>
      </nav>
      <button className={styles.postButton}>投稿する</button>
    </div>
  );
}
