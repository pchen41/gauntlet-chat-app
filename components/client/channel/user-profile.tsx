'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { Mail, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import UserAvatar from "../user-avatar/user-avatar"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { usePresenceState } from "@/contexts/presence-context"

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
  const [status, setStatus] = useState(profile?.status)
  const onlineUsers = usePresenceState()
  const isOnline = onlineUsers[userId] || false
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    // Subscribe to profile changes
    const channel = supabase.channel(`profile-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            setStatus(payload.new.status)
          }
        }
      )
      .subscribe()

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
            {status && (
              <p className="text-sm text-muted-foreground">{status}</p>
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
