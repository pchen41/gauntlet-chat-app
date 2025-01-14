'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

type PresenceState = Record<string, boolean>

const PresenceContext = createContext<PresenceState>({})

export function PresenceProvider({ children, user }: { children: React.ReactNode, user: User }) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceState>({})
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel('online-users')

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        const online: PresenceState = {}
        
        Object.values(presenceState).forEach(presence => {
          (presence as any[]).forEach(p => {
            online[p.user_id] = true
          })
        })
        
        setOnlineUsers(online)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id })
        }
      })
    
    return () => {
      channel.unsubscribe()
    }
  }, [])

  return (
    <PresenceContext.Provider value={onlineUsers}>
      {children}
    </PresenceContext.Provider>
  )
}

export const usePresenceState = () => useContext(PresenceContext) 