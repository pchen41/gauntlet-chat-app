'use client'

import { Avatar } from "@/components/ui/avatar";
import { Message, Profile } from "@/types/types";
import UserAvatar from "../user-avatar/user-avatar";
import { format, formatDistanceToNow } from "date-fns";
import { EmojiPicker } from "./emoji-picker";
import { Button } from "@/components/ui/button";
import { FileIcon, MessageCircle, MessageSquare, UserIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { User } from "@supabase/supabase-js";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { JSX } from "react";
import { usePresenceState } from "@/contexts/presence-context";

export default function ChatMessage({
  user,
  message,
  profiles,
  channelName,
  disabled,
  handleUserClick,
  onOpenThread,
  onAddReaction,
  onRemoveReaction,
}: {
  user: User,
  message: Message,
  profiles: Map<string, Profile>,
  channelName?: JSX.Element,
  disabled?: boolean,
  handleUserClick?: (userId: string) => void,
  onOpenThread?: (messageId: string) => void,
  onAddReaction: (id: string, messageId: string, userId: string, reaction: string, createdAt: string) => void,
  onRemoveReaction: (id: string) => void
}) {
  const profile = profiles.get(message.user_id)
  const name = profile?.name || ""
  const email = profile?.email || ""
  const status = profile?.status || undefined
  const supabase = createClient()
  const { toast } = useToast()
  
  type reaction = {
    reaction: string
    count: number
    users: {userId: string, reactionId: string}[]
    created_at: string
  }

  let reactions: Map<string, reaction> = new Map()
  message.message_reactions?.forEach(reaction => {
    let existingReaction = reactions.get(reaction.reaction)
    if (existingReaction) {
      existingReaction.count++
      existingReaction.users.push({userId: reaction.user_id, reactionId: reaction.id})
      if (reaction.created_at < existingReaction.created_at) {
        existingReaction.created_at = reaction.created_at
      }
    }
    else {
      reactions.set(reaction.reaction, {
        reaction: reaction.reaction,
        count: 1,
        users: [{userId: reaction.user_id, reactionId: reaction.id}],
        created_at: reaction.created_at
      })
    }
  })
  const sortedReactions = Array.from(reactions.values()).sort((a, b) => b.created_at > a.created_at ? -1 : 1)

  async function handleReactionClick(reaction: string) {
    try {
      // Check if user has already reacted with this emoji
      const hasReacted = message.message_reactions?.some(
        r => r.user_id === user.id && r.reaction === reaction
      );

      if (hasReacted) {
        // Remove reaction
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .match({
            message_id: message.id,
            user_id: user.id,
            reaction: reaction
          });

        if (error) throw error;
        onRemoveReaction(reaction)
      } else {
        // Add reaction
        const { data, error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: message.id,
            user_id: user.id,
            reaction: reaction,
            channel_id: message.channel_id
          }).select('id, created_at');

        if (error) throw error;
        onAddReaction(data[0].id, message.id, user.id, reaction, data[0].created_at)
      }
    } catch (error: any) {
      toast({
        title: 'Error updating reaction',
        description: error.message,
        variant: 'destructive'
      });
    }
  }
  const replyLength = message.replies?.length || 0
  const onlineUsers = usePresenceState()
  const isOnline = onlineUsers[message.user_id]

  return (
    <div className="hover:bg-muted/40 pt-2">
      { channelName && <span className="text-sm ml-4">{channelName}</span>}
      <div className={cn("flex items-start space-x-3 group p-4 pb-2 pt-0")}>
        <Avatar className="h-8 w-8 rounded-md flex-shrink-0 mt-1.5">
          {name && <UserAvatar name={name} email={email} /> }
        </Avatar>

        <div className="flex-grow">
          <div className="flex justify-between">
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {handleUserClick ? (
                    <span 
                      className="font-semibold cursor-pointer hover:underline"
                      onClick={() => handleUserClick(message.user_id)}
                    >
                      {name}
                    </span>
                    ) : (
                      <span className="font-semibold">{name}</span>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <div>{email}</div>
                    {status && <div>{status}</div>}
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="text-xs text-muted-foreground">{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-xs text-muted-foreground" title={format(new Date(message.created_at), 'PPpp')}>
                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              </span>
            </div>
            {!disabled && (
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <EmojiPicker 
                  onEmojiSelect={(emoji) => handleReactionClick(emoji)} 
                  className="h-8"
                />
                {!message.parent_id && onOpenThread && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onOpenThread(message.id)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Reply
                  </Button>
                )}
              </div>
            )}
          </div>
          <p>{message.message}</p>
          {message.message_attachments && (
            message.message_attachments.map((attachment, index) => (
              <Button variant="outline" className="mt-2" key={`attachment-${index}`} asChild>
                <a href={attachment.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-blue-600 hover:text-blue-600">
                  <FileIcon className="h-4 w-4" />
                  <span>{attachment.file_name}</span>
                </a>
              </Button>
            ))
          )}
          {!disabled && (
            <>
              <div className="mt-2 flex flex-wrap gap-1 items-center">
                {sortedReactions.map((reaction, index) => (
                  <TooltipProvider key={`reaction-${index}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`px-2 py-0 h-8 ${reaction.users.some((reactionUser) => reactionUser.userId === user.id) ? 'bg-sky-50' : ''}`}
                          onClick={() => handleReactionClick(reaction.reaction)}
                        >
                          {reaction.reaction} {reaction.count}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {reaction.users.map((user, index) => {
                          const reactingUser = profiles.get(user.userId)?.name || 'Unknown User'
                          return <div key={`user-${index}`}>{reactingUser}</div>
                        })}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
              {onOpenThread && !message.parent_id && replyLength > 0 && (
                <div 
                  className="mt-2 text-sm text-blue-600 cursor-pointer flex items-center"
                  onClick={() => onOpenThread(message.id)}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {replyLength} {replyLength === 1 ? 'reply' : 'replies'}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
