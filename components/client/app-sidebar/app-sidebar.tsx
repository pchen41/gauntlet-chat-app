'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { User } from "@supabase/supabase-js"
import Footer from "./footer"
import Channels from "./channels"
import { Channel, Profile } from "@/types/types"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { usePathname } from 'next/navigation'

export function AppSidebar({user, initialChannels}: {user: User, initialChannels: Channel[]}) {
  const [channels, setChannels] = useState<Channel[]>(initialChannels)
  const supabase = createClient()
  const pathname = usePathname()

  const fetchChannels = async () => {
    const { data: channelMembers } = await supabase
      .from('channel_members')
      .select(`
        channel_id,
        created_at,
        updated_at,
        channels:channel_id (
          id,
          name,
          type,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .is('hidden_from_channel_list', false)

    if (channelMembers) {
      const { data: allMembers } = await supabase
        .from('channel_members')
        .select(`
          channel_id,
          profiles:user_id (
            name
          )
        `)
        .in('channel_id', channelMembers.map(m => m.channel_id))
        .neq('user_id', user.id)

      const membersByChannel = allMembers?.reduce((acc, member) => {
        if (!acc[member.channel_id]) {
          acc[member.channel_id] = []
        }
        // @ts-ignore
        acc[member.channel_id].push((member.profiles as Profile).name)
        return acc
      }, {} as Record<string, string[]>) || {}

      const updatedChannels = channelMembers.map(member => {
        // @ts-ignore
        const channel = member.channels as {id: string, name: string, type: string, created_at: string}
        let name = channel.name

        if (channel.type === 'direct' && membersByChannel[channel.id]) {
          name = membersByChannel[channel.id].join(', ')
        }

        return {
          id: channel.id,
          name,
          type: channel.type,
          joinedAt: member.created_at,
          updatedAt: member.updated_at
        }
      })

      setChannels(updatedChannels)
    }
  }

  useEffect(() => {
    const channel = supabase
      .channel('channel-changes-'+user.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'channel_members',
        filter: `user_id=eq.${user.id}`,
      }, async () => {
        await fetchChannels()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id, supabase, fetchChannels])

  let channelId = undefined
  if (pathname.includes('/client/channel/')) {
    channelId = pathname.split('/').pop()
  }

  return (
    <Sidebar collapsible="none" className="h-screen" variant="inset">
      <SidebarHeader className="p-4">
        <h1 className="text-xl font-bold">pChat</h1>
      </SidebarHeader>
      <SidebarContent>
        <Channels user={user} channels={channels} selectedChannelId={channelId}/>
      </SidebarContent>
      <Footer user={user} />
    </Sidebar>
  )
}