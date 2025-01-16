'use client'

import { Hash, Layout, LayoutGrid, LockIcon, MessageSquare, MessageSquarePlus, Plus, Search, Bot, Circle } from "lucide-react";
import ChannelList from "./channel-list";
import { useRouter } from 'next/navigation'
import { User } from "@supabase/supabase-js";
import React, { useState } from "react";
import { Channel } from "@/types/types";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import Link from "next/link";
import { CreateDMModal } from "./create-dm-modal";
import { CreateAvatarChatModal } from "./create-avatar-chat-modal";
import { usePresenceState } from "@/contexts/presence-context";
import { cn } from "@/lib/utils";

export default function Channels({user, channels, selectedChannelId}: {user: User, channels: (Channel & {profiles?: {id: string, status: string, name: string}[]})[], selectedChannelId?: string}) {
  const [isDMModalOpen, setIsDMModalOpen] = useState(false)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const onlineUsers = usePresenceState()
  
  const channelsList = channels.filter(channel => channel.type != "direct").sort((a, b) => a.joinedAt > b.joinedAt ? 1 : -1).map((channel) => ({
    name: channel.name,
    url: `/client/channel/${channel.id}`,
    icon: channel.type === 'public' ? <Hash/> : <LockIcon/>,
    selected: channel.id === selectedChannelId,
  }))

  const dmsList = channels.filter(channel => channel.type == "direct").sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1).map((channel) => {
    const icon = <MessageSquare className={channel.profiles && channel.profiles.some(profile => onlineUsers[profile.id]) ? 'text-green-600' : ''}/>

    return {
      name: channel.name,
      url: `/client/channel/${channel.id}`,
      icon: icon,
      selected: channel.id === selectedChannelId,
      tooltip: channel.profiles ? (
        <div className="flex flex-col gap-1">
          {channel.profiles.map(profile => (
            <div key={profile.id} className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", onlineUsers[profile.id] ? 'bg-green-500' : 'bg-gray-400')}></span>
              <span>{profile.name}</span>
              {profile.status && <span className="text-muted-foreground">{profile.status}</span>}
            </div>
          ))}
        </div>
      ) : undefined
  }})

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
      <ChannelList label="User Avatars" items={[]} footerItem={avatarsFooter} />
    </>
  )
}