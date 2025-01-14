'use client'

import { Hash, Layout, LayoutGrid, LockIcon, MessageSquare, MessageSquarePlus, Plus, Search } from "lucide-react";
import ChannelList from "./channel-list";
import { useRouter } from 'next/navigation'
import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { Channel } from "@/types/types";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import Link from "next/link";
import { CreateDMModal } from "./create-dm-modal";

export default function Channels({user, channels, selectedChannelId}: {user: User, channels: Channel[], selectedChannelId?: string}) {
  const [isDMModalOpen, setIsDMModalOpen] = useState(false)

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
          <span>Manage channels</span>
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
      <ChannelList label="Channels" items={channelsList} footerItem={channelsFooter}/>
      <ChannelList label="Direct Messages" items={dmsList} footerItem={dmsFooter} />
    </>
  )
}