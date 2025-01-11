'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { Mail, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import UserAvatar from "../user-avatar/user-avatar"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

interface UserProfileProps {
  userId: string
  profiles: Record<string, {
    id: string
    name: string
    email: string
    status?: string | null
  }>
  handleCloseProfile: () => void
}

export function UserProfile({ userId, profiles, handleCloseProfile }: UserProfileProps) {
  const profile = profiles[userId]
  const [isOnline, setIsOnline] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel('online-users')
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        const isUserOnline = Object.values(presenceState).some(presence => 
          (presence as any[]).some(p => p.user_id === userId)
        )
        setIsOnline(isUserOnline)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const isUserJoined = newPresences.some(p => p.user_id === userId)
        if (isUserJoined) {
          setIsOnline(true)
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const isUserLeft = leftPresences.some(p => p.user_id === userId)
        if (isUserLeft) {
          setIsOnline(false)
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId })
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [userId, supabase])

  if (!profile) return null

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 pl-4 flex items-center justify-between">
        <h3 className="font-semibold">{/*Profile*/}</h3>
        <Button variant="ghost" size="icon" onClick={handleCloseProfile}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4 pt-0">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-20 w-20 rounded-lg">
            <UserAvatar name={profile.name} email={profile.email} textClass="text-3xl"/>
          </Avatar>

          <div className="text-center">
            <h3 className="font-semibold text-lg">{profile.name}</h3>
            {profile.status && (
              <p className="text-sm text-muted-foreground">{profile.status}</p>
            )}
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-sm text-muted-foreground">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          <div className="w-full pt-4 border-t">
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="h-4 w-4 mr-2" />
              {profile.email}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
