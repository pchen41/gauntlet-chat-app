'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/utils/supabase-client'
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Hash, Lock, MoreHorizontal, Users, MessageSquare } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"
import { ChannelMembersDialog } from './ChannelMembersDialog'

type ChannelHeaderProps = {
  channelId: string
  channelName: string
  channelType: 'public' | 'private' | 'direct'
  onLeaveChannel: () => void
  leaveButtonText: string
}

export function ChannelHeader({ channelId, channelName, channelType, onLeaveChannel, leaveButtonText }: ChannelHeaderProps) {
  const { user } = useAuth()
  const [isLeaving, setIsLeaving] = useState(false)
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)

  async function leaveChannel() {
    if (!user) return;
    setIsLeaving(true)

    const { error } = await supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', user.id)

    setIsLeaving(false)

    if (error) {
      console.error('Error leaving channel:', error)
      toast({
        title: "Error",
        description: "Failed to leave channel",
        variant: "destructive",
      })
    } else {
      onLeaveChannel()
      toast({
        title: "Success",
        description: "Left channel successfully",
      })
    }
  }

  async function hideChannel() {
    if (!user) return;
    setIsLeaving(true);

    const { error } = await supabase
      .from('channel_members')
      .update({ hidden: true })
      .eq('channel_id', channelId)
      .eq('user_id', user.id);

    setIsLeaving(false);

    if (error) {
      console.error('Error hiding channel:', error);
      toast({
        title: "Error",
        description: "Failed to hide channel",
        variant: "destructive",
      });
    } else {
      onLeaveChannel();
      toast({
        title: "Success",
        description: "Channel hidden successfully",
      });
      // Trigger an event to update the sidebar
      window.dispatchEvent(new Event('channelUpdate'));
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-2">
        {channelType === 'public' ? <Hash className="h-5 w-5" /> : 
         channelType === 'private' ? <Lock className="h-5 w-5" /> : 
         <MessageSquare className="h-5 w-5" />}
        <h2 className="text-lg font-semibold">{channelName}</h2>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {channelType !== 'direct' && (
            <DropdownMenuItem onClick={() => setIsMembersDialogOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Manage Members
            </DropdownMenuItem>
          )}
          <DropdownMenuItem 
            onClick={channelType === 'direct' ? hideChannel : leaveChannel}
            disabled={isLeaving}
            className="text-red-600 focus:text-red-600 focus:bg-red-100"
          >
            {leaveButtonText}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChannelMembersDialog
        channelId={channelId}
        isOpen={isMembersDialogOpen}
        onClose={() => setIsMembersDialogOpen(false)}
      />
    </div>
  )
}

