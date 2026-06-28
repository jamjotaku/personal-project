'use client'

import { useState, useEffect } from 'react'
import styles from './settings.module.css'
import { saveWidgetSettings } from '../actions/widgets'
import { useRouter } from 'next/navigation'

const availableWidgets = [
  { id: 'clock', label: '🕒 時計＆日付' },
  { id: 'weather', label: '🌤️ お天気（千葉）' },
  { id: 'countdown', label: '🗓️ カウントダウン（旅行）' },
  { id: 'stickynote', label: '📝 クイック付箋' },
  { id: 'image', label: '🖼️ お気に入り画像' },
  { id: 'mental', label: '🧠 メンタルグラフ' },
  { id: 'music', label: '🎵 音楽プレイヤー' },
  { id: 'discord', label: '💬 Discord連携' },
]

export default function SettingsPage() {
  const router = useRouter()
  const [activeIds, setActiveIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // 初期ロード時、クッキーから読み込めないので、便宜上 localStorageやCookieから読む処理を入れるより、
  // デフォルト配列をセットしておき、ユーザーが自由に変える形にする。
  // 厳密にはSSRでpropsとして受け取るのがベストだが、シンプル化のためクライアント側で管理する。
  useEffect(() => {
    // 疑似的にクッキーの文字列を取得
    const match = document.cookie.match(new RegExp('(^| )active_widgets=([^;]+)'))
    if (match) {
      try {
        const parsed = JSON.parse(decodeURIComponent(match[2]))
        setActiveIds(parsed)
      } catch {
        setActiveIds(availableWidgets.map(w => w.id))
      }
    } else {
      setActiveIds(availableWidgets.map(w => w.id))
    }
  }, [])

  const toggleWidget = (id: string) => {
    if (activeIds.includes(id)) {
      setActiveIds(activeIds.filter(w => w !== id))
    } else {
      setActiveIds([...activeIds, id])
    }
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const newArr = [...activeIds]
    const temp = newArr[index - 1]
    newArr[index - 1] = newArr[index]
    newArr[index] = temp
    setActiveIds(newArr)
  }

  const moveDown = (index: number) => {
    if (index === activeIds.length - 1) return
    const newArr = [...activeIds]
    const temp = newArr[index + 1]
    newArr[index + 1] = newArr[index]
    newArr[index] = temp
    setActiveIds(newArr)
  }

  const handleSave = async () => {
    setIsSaving(true)
    await saveWidgetSettings(activeIds)
    setIsSaving(false)
    alert('設定を保存しました！右サイドバーの表示が更新されています。')
    router.refresh() // 強制的に再描画
  }

  // 表示されていないウィジェットのリスト
  const inactiveWidgets = availableWidgets.filter(w => !activeIds.includes(w.id))

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>⚙️ ウィジェット設定</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        右サイドバーに表示するウィジェットを選んで、自分好みのダッシュボードを作りましょう！
      </p>

      <div className={styles.layoutManager}>
        <div className={styles.activeSection}>
          <h2>表示中のウィジェット (並び替え可能)</h2>
          <div className={styles.list}>
            {activeIds.map((id, idx) => {
              const widgetDef = availableWidgets.find(w => w.id === id)
              if (!widgetDef) return null
              return (
                <div key={id} className={styles.listItem}>
                  <span>{widgetDef.label}</span>
                  <div className={styles.actions}>
                    <button onClick={() => moveUp(idx)} disabled={idx === 0}>↑</button>
                    <button onClick={() => moveDown(idx)} disabled={idx === activeIds.length - 1}>↓</button>
                    <button onClick={() => toggleWidget(id)} className={styles.removeBtn}>非表示</button>
                  </div>
                </div>
              )
            })}
            {activeIds.length === 0 && <p style={{color: 'var(--text-secondary)'}}>表示するウィジェットがありません。</p>}
          </div>
        </div>

        <div className={styles.inactiveSection}>
          <h2>非表示のウィジェット</h2>
          <div className={styles.list}>
            {inactiveWidgets.map((widget) => (
              <div key={widget.id} className={styles.listItem}>
                <span>{widget.label}</span>
                <button onClick={() => toggleWidget(widget.id)} className={styles.addBtn}>追加</button>
              </div>
            ))}
            {inactiveWidgets.length === 0 && <p style={{color: 'var(--text-secondary)'}}>すべて表示中です。</p>}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '32px' }}>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className={styles.saveBtn}
        >
          {isSaving ? '保存中...' : '💾 設定を保存する'}
        </button>
      </div>
    </div>
  )
}
