'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type DiscordStatus = {
  id: string
  user_id: string
  status: string
  activity: string
  vc_channel_name: string
  updated_at: string
}

export default function DiscordPanel() {
  const [status, setStatus] = useState<DiscordStatus | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let channel: any = null;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const userId = session.user.id

      // 初回ロード時に最新ステータスを取得
      const { data } = await supabase
        .from('discord_status')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
      if (data) {
        setStatus(data)
      }

      // リアルタイムサブスクリプション
      channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'discord_status', filter: `user_id=eq.${userId}` },
          (payload) => {
            setStatus(payload.new as DiscordStatus)
          }
        )
        .subscribe()
    }
    
    init()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase])

  if (!status) return null

  // ステータスに応じた色やUI
  const isOnline = status.status !== 'offline'
  const isVoice = !!status.vc_channel_name
  const isGaming = !!status.activity

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '16px',
      padding: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: '16px'
    }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ 
          display: 'inline-block', 
          width: '10px', 
          height: '10px', 
          borderRadius: '50%', 
          background: isOnline ? '#3ba55c' : '#747f8d',
          boxShadow: isOnline ? '0 0 8px #3ba55c' : 'none'
        }} />
        Discord Status
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {isGaming && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            🎮 <span>Playing <strong>{status.activity}</strong></span>
          </div>
        )}
        
        {isVoice && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3ba55c', fontWeight: 'bold' }}>
            🎙️ <span>In VC: <strong>{status.vc_channel_name}</strong></span>
          </div>
        )}

        {!isGaming && !isVoice && (
          <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            {isOnline ? 'Online - Not in a game' : 'Offline'}
          </div>
        )}
      </div>
    </div>
  )
}
