'use client'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Channel } from "@/types/types";
import { ArrowLeftFromLine, Hash, LockIcon, MessageSquare, MoreHorizontal, MoreVertical, Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import ChannelMembersDialog from "./channel-members-dialog";
import { Separator } from "@/components/ui/separator";

export default function ChannelHeader({user, channel, isMember}: {user: User, channel: Channel, isMember: boolean}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)
  const supabase = createClient()
  
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
        <h2 className="text-lg font-semibold">{channel.name}</h2>
        {channel.description && (
          <div className="text-sm text-muted-foreground pl-0.25">
            {channel.description}
          </div>
        )}

      </div>
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
      <ChannelMembersDialog
        user={user}
        channel={channel}
        isOpen={isMembersDialogOpen}
        onClose={() => setIsMembersDialogOpen(false)}
      />
    </div>
  );
}