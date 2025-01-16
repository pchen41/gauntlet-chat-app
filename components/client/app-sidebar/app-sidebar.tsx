'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { User } from "@supabase/supabase-js"
import Footer from "./footer"
import Channels from "./channels"
import { Channel, Profile } from "@/types/types"
import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { usePathname } from 'next/navigation'
import Link from "next/link"

type SidebarChannel = Channel & {profiles?: {id: string, status: string, name: string}[]}
export function AppSidebar({user, initialChannels}: {user: User, initialChannels: Channel[]}) {
  const [channels, setChannels] = useState<SidebarChannel[]>(initialChannels)
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
            id,
            name,
            status
          )
        `)
        .in('channel_id', channelMembers.map(m => m.channel_id))
        .neq('user_id', user.id)

      const membersByChannel = allMembers?.reduce((acc, member) => {
        if (!acc[member.channel_id]) {
          acc[member.channel_id] = []
        }
        // @ts-expect-error
        acc[member.channel_id].push((member.profiles as Profile))
        return acc
      }, {} as Record<string, string[]>) || {}

      const updatedChannels = channelMembers.map(member => {
        // @ts-expect-error
        const channel = member.channels as {id: string, name: string, type: string, created_at: string}
        let name = channel.name
        let profiles = undefined

        if (channel.type === 'direct' && membersByChannel[channel.id]) {
          // @ts-expect-error
          name = membersByChannel[channel.id].map(m => m.name).join(', ')
          // @ts-expect-error
          profiles = membersByChannel[channel.id].map(m => ({id: m.id, status: m.status, name: m.name}))
        }

        return {
          id: channel.id,
          name,
          type: channel.type,
          joinedAt: member.created_at,
          updatedAt: member.updated_at,
          profiles
        }
      })

      setChannels(updatedChannels)
    }
  }

  useEffect(() => {
    fetchChannels()
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
  }, [user.id, supabase])

  let channelId = undefined
  if (pathname.includes('/client/channel/')) {
    channelId = pathname.split('/').pop()
  }

  return (
    <Sidebar collapsible="none" className="h-screen" variant="inset">
      <SidebarHeader className="p-4">
        <Link href="/client" className="text-xl font-bold">pChat</Link>
      </SidebarHeader>
      <SidebarContent>
        <Channels user={user} channels={channels} selectedChannelId={channelId}/>
      </SidebarContent>
      <Footer user={user} />
    </Sidebar>
  )
}