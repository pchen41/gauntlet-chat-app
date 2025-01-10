'use client'

import { Hash, LayoutGrid, LockIcon, MessageSquare, MessageSquarePlus, Plus, Search, Settings2 } from "lucide-react";
import ChannelList from "./channel-list";
import { useRouter } from 'next/navigation'
import { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { Channel } from "@/types/types";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import Link from "next/link";
import { CreateDMModal } from "./create-dm-modal";

export default function Channels({user, channels, selectedChannelId}: {user: User, channels: Channel[], selectedChannelId?: string}) {
  const router = useRouter()
  const [isDMModalOpen, setIsDMModalOpen] = useState(false)

  const channelButton = {
    icon: <Search className="h-4 w-4" />,
    onClick: () => {
      router.push('/client/channels')
    }
  }

  const directMessagesButton = {
    icon: <Plus className="h-4 w-4" />,
    onClick: () => {
      setIsDMModalOpen(true)
    }
  }

  const channelsList = channels.filter(channel => channel.type != "direct").sort((a, b) => a.joinedAt > b.joinedAt ? 1 : -1).map((channel) => ({
    name: channel.name,
    url: `/client/channel/${channel.id}`,
    icon: channel.type === 'public' ? <Hash/> : <LockIcon/>,
    selected: channel.id === selectedChannelId
  }))

  const dmsList = channels.filter(channel => channel.type == "direct").sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1).map((channel) => ({
    name: channel.name,
    url: `/client/channel/${channel.id}`,
    icon: <MessageSquare/>,
    selected: channel.id === selectedChannelId
  }))

  const channelsFooter = (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link href="/client/channels" className="text-primary/50 hover:text-primary/50 active:text-primary/50">
          <LayoutGrid/>
          <span>Browse channels</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )

  const dmsFooter = (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={() => setIsDMModalOpen(true)} className="text-primary/50 hover:text-primary/50 active:text-primary/50">
        <MessageSquarePlus/>
        <span>Create message</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )

  return (
    <>
      <CreateDMModal
        isOpen={isDMModalOpen}
        onClose={() => setIsDMModalOpen(false)}
        currentUser={user}
      />
      <ChannelList label="Channels" items={channelsList} labelButton={channelButton} footerItem={channelsFooter}/>
      <ChannelList label="Direct Messages" items={dmsList} labelButton={directMessagesButton} footerItem={dmsFooter} />
    </>
  )
}