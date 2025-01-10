'use client'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Channel } from "@/types/types";
import { ArrowLeftFromLine, Hash, LockIcon, MessageSquare, MoreHorizontal, MoreVertical, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import ChannelMembersDialog from "./channel-members-dialog";
import { Separator } from "@/components/ui/separator";

export default function ChannelHeader({user, channel}: {user: User, channel: Channel}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLeaving, setIsLeaving] = useState(false)
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)
  const supabase = createClient()
  
  var icon = <Hash className="h-4 w-4" />
  if (channel.type === 'private') {
    icon = <LockIcon className="h-4 w-4" />
  } else if (channel.type === 'direct') {
    icon = <MessageSquare className="h-4 w-4" />
  }


  async function leaveChannel() {
    if (!user) return;
    setIsLeaving(true)

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
      setIsLeaving(false)
    } else {
      router.push('/client')
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
      .update({ hidden_from_channel_list: true })
      .eq('channel_id', channel.id)
      .eq('user_id', user.id);

    setIsLeaving(false);

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
          <DropdownMenuItem onClick={() => setIsMembersDialogOpen(true)}>
            <Users className="h-4 w-4" />
            {channel.type === 'direct' ? 'View Members' : 'Manage Members'}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={channel.type === 'direct' ? hideChannel : leaveChannel}
            disabled={isLeaving}
            className="text-red-600 focus:text-red-600 focus:bg-red-100"
          >
            <ArrowLeftFromLine className="h-4 w-4" />
            {channel.type === 'direct' ? 'Hide Channel' : 'Leave Channel'}
          </DropdownMenuItem>
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