'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { supabase } from '@/utils/supabase-client'
import { Button } from "@/components/ui/button"
import { Hash, Lock, PlusCircle, Settings, MessageSquare, Search, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar"
import { useRouter } from 'next/navigation'
import { StartDMDialog } from './StartDMDialog'

type Channel = {
  id: string
  name: string
  type: 'public' | 'private' | 'direct'
  created_by: string
  is_member: boolean
  hidden?: boolean
  participant_names?: string | null
}

type SidebarProps = {
  selectedChannelId: string | null
  refreshTrigger?: number
}

export function AppSidebar({ selectedChannelId, refreshTrigger = 0 }: SidebarProps) {
  const { user, updateUserContext } = useAuth()
  const { toggleSidebar } = useSidebar()
  const [channels, setChannels] = useState<Channel[]>([])
  const [directChannels, setDirectChannels] = useState<Channel[]>([])
  const [isStartDMDialogOpen, setIsStartDMDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchChannels = useCallback(async () => {
    if (!user) return;

    setIsLoading(true)
    try {
      const { data: memberChannels, error: memberError } = await supabase
        .from('channel_members')
        .select('channel_id, hidden')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      const memberChannelIds = memberChannels.map(mc => mc.channel_id);

      const { data: allChannels, error: channelError } = await supabase
        .from('channels')
        .select(`
          *,
          channel_members!inner (
            user_id,
            hidden,
            profiles:user_id (
              name
            )
          )
        `)
        .in('id', memberChannelIds);

      if (channelError) throw channelError;

      const processedChannels = allChannels.map(channel => ({
        ...channel,
        is_member: true,
        hidden: channel.channel_members.find(cm => cm.user_id === user.id)?.hidden || false,
        participant_names: channel.type === 'direct'
          ? channel.channel_members
              .filter(member => member.user_id !== user.id)
              .map(member => member.profiles.name)
              .join(', ')
          : null
      }));

      setChannels(processedChannels.filter(c => c.type !== 'direct'));
      setDirectChannels(processedChannels.filter(c => c.type === 'direct' && !c.hidden));
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setIsLoading(false)
    }
  }, [user]);

  useEffect(() => {
    fetchChannels()
  }, [fetchChannels, refreshTrigger])

  useEffect(() => {
    if (user) {
      const channelSubscription = supabase
        .channel('public:channels')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, () => {
          fetchChannels()
        })
        .subscribe()

      const memberSubscription = supabase
        .channel('public:channel_members')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'channel_members' }, () => {
          fetchChannels()
        })
        .subscribe()

      const profileSubscription = supabase
        .channel('public:profiles')
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          async () => {
            await updateUserContext()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channelSubscription)
        supabase.removeChannel(memberSubscription)
        supabase.removeChannel(profileSubscription)
      }
    }
  }, [user, updateUserContext, fetchChannels])

  function openStartDMDialog() {
    setIsStartDMDialogOpen(true)
  }

  if (isLoading) {
    return (
      <Sidebar className="w-64 border-r border-border" collapsible="none">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar className="w-64 border-r border-border" collapsible="none">
      <SidebarHeader className="p-4">
        <h1 className="text-xl font-bold">pChat</h1>
      </SidebarHeader>
      {user ? (
        <>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between px-3 py-2">
                Channels
                <Link href="/client/browse-channels">
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Search className="h-4 w-4" />
                  </Button>
                </Link>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {channels.map(channel => (
                    <SidebarMenuItem key={channel.id}>
                      <SidebarMenuButton asChild isActive={selectedChannelId === channel.id}>
                        <Link href={`/client/channel/${channel.id}`} className="flex items-center px-3 py-2 text-sm">
                          {channel.type === 'public' ? <Hash className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          {channel.name}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between px-3 py-2">
                Direct Messages
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={openStartDMDialog}>
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {directChannels.map(channel => (
                    <SidebarMenuItem key={channel.id}>
                      <SidebarMenuButton asChild isActive={selectedChannelId === channel.id}>
                        <Link href={`/client/channel/${channel.id}`} className="flex items-center px-3 py-2 text-sm">
                          <MessageSquare className="h-4 w-4" />
                          {channel.participant_names || 'Direct Message'}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center justify-between px-4 py-3 hover:bg-accent">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${user?.user_metadata?.name || user?.email}`} />
                  <AvatarFallback>{user?.user_metadata?.name?.[0] || user?.email?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium">{user?.user_metadata?.name || user?.email}</p>
                  <p className="text-xs text-muted-foreground">{user?.user_metadata?.status || 'Online'}</p>
                </div>
              </div>
              <Link href="/client/profile">
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </SidebarFooter>
        </>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )}
      <StartDMDialog
        isOpen={isStartDMDialogOpen}
        onClose={() => setIsStartDMDialogOpen(false)}
        onDMCreated={fetchChannels}
      />
    </Sidebar>
  )
}

