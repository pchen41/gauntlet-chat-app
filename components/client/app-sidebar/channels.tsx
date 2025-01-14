'use client'

import { Hash, Layout, LayoutGrid, LockIcon, MessageSquare, MessageSquarePlus, Plus, Search, Bot } from "lucide-react";
import ChannelList from "./channel-list";
import { useRouter } from 'next/navigation'
import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { Channel } from "@/types/types";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import Link from "next/link";
import { CreateDMModal } from "./create-dm-modal";
import { CreateAvatarChatModal } from "./create-avatar-chat-modal";

export default function Channels({user, channels, selectedChannelId}: {user: User, channels: Channel[], selectedChannelId?: string}) {
  const [isDMModalOpen, setIsDMModalOpen] = useState(false)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)

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

  const avatarsFooter = (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={() => setIsAvatarModalOpen(true)} className="text-muted-foreground hover:text-muted-foreground active:text-muted-foreground">
        <Bot/>
        <span>Chat with an avatar</span>
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
      <CreateAvatarChatModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentUser={user}
      />
      <ChannelList label="Channels" items={channelsList} footerItem={channelsFooter}/>
      <ChannelList label="Direct Messages" items={dmsList} footerItem={dmsFooter} />
      <ChannelList label="AI Avatars" items={[]} footerItem={avatarsFooter} />
    </>
  )
}