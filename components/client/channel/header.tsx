'use client'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Channel } from "@/types/types";
import { ArrowLeftFromLine, Hash, LockIcon, MessageSquare, MoreHorizontal, MoreVertical, Users, UserPlus, BotMessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import ChannelMembersDialog from "./channel-members-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AvatarChat } from "@/components/client/avatar-chat/avatar-chat"

export default function ChannelHeader({user, channel, isMember}: {user: User, channel: Channel, isMember: boolean}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)
  const [channelTitle, setChannelTitle] = useState('')
  const [aiAvatarUser, setAIAvatarUser] = useState<{id: string, name: string, email: string} | null>(null)
  const supabase = createClient()
  const [isAvatarChatOpen, setIsAvatarChatOpen] = useState(false)
  
  useEffect(() => {
    if (channel.type === 'direct') {
      fetchMembers()
    } else {
      setChannelTitle(channel.name)
    }
  }, [channel.id])

  async function fetchMembers() {
    const { data: members, error } = await supabase
      .from('channel_members')
      .select(`
        profiles:user_id (
          id,
          name,
          email
        )
      `)
      .neq('user_id', user.id)
      .eq('channel_id', channel.id)

    if (error) {
      console.error('Error fetching members:', error)
      setChannelTitle(channel.name)
      return
    }

    if (members) {
      const memberNames = members
        .map(member => (member.profiles as any).name)
      setChannelTitle(memberNames.join(', '))

      if (memberNames.length === 1) {
        // @ts-expect-error
        setAIAvatarUser({id: members[0].profiles.id, name: members[0].profiles.name, email: members[0].profiles.email})
      }
    }
  }

  var icon = <Hash className="h-4 w-4" />
  if (channel.type === 'private') {
    icon = <LockIcon className="h-4 w-4" />
  } else if (channel.type === 'direct') {
    icon = <MessageSquare className="h-4 w-4" />
  }

  async function joinChannel() {
    if (!user) return;
    setIsLoading(true)

    const { error } = await supabase
      .from('channel_members')
      .insert({ channel_id: channel.id, user_id: user.id })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to join channel",
        variant: "destructive",
      })
    } else {
      router.refresh()
    }
    setIsLoading(false)
  }

  async function leaveChannel() {
    if (!user) return;
    setIsLoading(true)

    const { error } = await supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channel.id)
      .eq('user_id', user.id)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to leave channel",
        variant: "destructive",
      })
    } else {
      router.push('/client')
      toast({
        title: "Success",
        description: "Left channel successfully",
      })
    }
    setIsLoading(false)
  }

  async function hideChannel() {
    if (!user) return;
    setIsLoading(true);

    const { error } = await supabase
      .from('channel_members')
      .update({ hidden_from_channel_list: true })
      .eq('channel_id', channel.id)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to hide channel",
        variant: "destructive",
      });
    } else {
      router.push('/client')
      toast({
        title: "Success",
        description: "Channel hidden successfully",
      });
    }
    setIsLoading(false);
  }

  return (
    <div className="flex items-center justify-between p-2 border-b">
      <div className="flex items-center space-x-2">
        {icon}
        <h2 className="text-lg font-semibold">{channelTitle}</h2>
        {channel.description && (
          <div className="text-sm text-muted-foreground pl-0.25">
            {channel.description}
          </div>
        )}

      </div>
      <div className="flex items-center gap-1">
        {aiAvatarUser && (
          <>
            <TooltipProvider>
              <Tooltip delayDuration={400}>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsAvatarChatOpen(true)}
                  >
                    <BotMessageSquare className="h-6 w-6 text-blue-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{aiAvatarUser.name} not responding? Chat with {aiAvatarUser.name}'s AI avatar instead!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <AvatarChat
              avatarProfile={{
                id: aiAvatarUser.id,
                name: aiAvatarUser.name,
                email: aiAvatarUser.email
              }}
              isOpen={isAvatarChatOpen}
              onOpenChange={setIsAvatarChatOpen}
            />
          </>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isMember ? (
              <>
                <DropdownMenuItem onClick={() => setIsMembersDialogOpen(true)}>
                  <Users className="h-4 w-4" />
                  {channel.type === 'direct' ? 'View Members' : 'Manage Members'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={channel.type === 'direct' ? hideChannel : leaveChannel}
                  disabled={isLoading}
                  className="text-red-600 focus:text-red-600 focus:bg-red-100"
                >
                  <ArrowLeftFromLine className="h-4 w-4" />
                  {channel.type === 'direct' ? 'Hide Channel' : 'Leave Channel'}
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onClick={joinChannel} disabled={isLoading}>
                <UserPlus className="h-4 w-4" />
                Join Channel
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ChannelMembersDialog
        user={user}
        channel={channel}
        isOpen={isMembersDialogOpen}
        onClose={() => setIsMembersDialogOpen(false)}
      />
    </div>
  );
}