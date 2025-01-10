'use client'

import { User } from "@supabase/supabase-js";
import { useEffect, useRef, useState, useMemo, SetStateAction, Dispatch } from "react";
import { createClient } from "@/lib/supabase/client";
import { useInView } from "react-intersection-observer";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle } from "lucide-react";
import { Message, Profile } from "@/types/types";
import ChatMessage from "./chat-message";

const PAGE_SIZE = 20;

export default function ChatMessages({
  user,
  channelId,
  profiles,
  fetchProfiles,
  messagesMap,
  setMessagesMap,
  onOpenThread,
  addReaction,
  removeReaction,
  handleUserClick
}: {
  user: User,
  channelId: string,
  profiles: Map<string, Profile>,
  fetchProfiles: (userIds: string[]) => Promise<void>,
  messagesMap: Map<string, Message>,
  setMessagesMap: Dispatch<SetStateAction<Map<string, Message>>>,
  onOpenThread: (messageId: string) => void,
  addReaction: (id: string, messageId: string, userId: string, reaction: string, createdAt: string) => void,
  removeReaction: (id: string) => void,
  handleUserClick: (userId: string) => void
}) {
  const { toast }= useToast()
  const [messageIds, setMessageIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { ref: loadMoreRef, inView } = useInView();

  
  // Reset messages when channel changes
  useEffect(() => {
    setMessageIds([]);
    setMessagesMap(new Map());
    setHasMore(true);
    fetchMessages();
    
    // Subscribe to new messages and reactions
    const channel = supabase
      .channel(`channel-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (!messagesMap.has(newMessage.id)) {
            // If it's a reply, add it to the parent's replies array
            if (newMessage.parent_id) {
              setMessagesMap(prev => {
                const newMap = new Map(prev);
                newMap.set(newMessage.id, newMessage);
                
                const parentMessage = newMap.get(newMessage.parent_id!);
                if (parentMessage) {
                  newMap.set(newMessage.parent_id!, {
                    ...parentMessage,
                    replies: [...(parentMessage.replies || []), newMessage.id]
                  });
                }
                return newMap;
              });
            } else {
              // If it's a parent message, add it to the beginning of messageIds
              setMessageIds(prev => [newMessage.id, ...prev]);
              setMessagesMap(prev => {
                const newMap = new Map(prev);
                newMap.set(newMessage.id, {
                  ...newMessage,
                  replies: []
                });
                return newMap;
              });
            }
            fetchProfiles([newMessage.user_id]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          addReaction(payload.new.id, payload.new.message_id, payload.new.user_id, payload.new.reaction, payload.new.created_at)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'message_reactions',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {          
          removeReaction(payload.old.id)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public', 
          table: 'message_attachments',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          setMessagesMap(prev => {
            const newMap = new Map(prev);
            const message = newMap.get(payload.new.message_id);
            if (message) {
              newMap.set(payload.new.message_id, {
                ...message,
                message_attachments: [
                  ...(message.message_attachments || []),
                  {
                    file_url: payload.new.file_url,
                    file_name: payload.new.file_name
                  }
                ]
              });
            }
            return newMap;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  // Load more messages when scrolling up
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      const lastMessage = messagesMap.get(messageIds[messageIds.length - 1]);
      fetchMessages(lastMessage?.created_at);
    }
  }, [inView]);

  async function fetchMessages(lastTimestamp?: string) {
    setIsLoading(true);
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          message_attachments(file_url, file_name),
          message_reactions(id, user_id, reaction, created_at),
          replies:messages!parent_id(
            id,
            user_id,
            parent_id,
            message,
            created_at,
            message_attachments(file_url, file_name),
            message_reactions(id, user_id, reaction, created_at)
          )
        `)
        .eq('channel_id', channelId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (lastTimestamp) {
        query = query.lt('created_at', lastTimestamp);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get unique user IDs from messages and replies
      const userIds = [...new Set([
        ...(data || []).map(msg => msg.user_id),
        ...(data || []).flatMap(msg => (msg.replies as Message[] || []).map(reply => reply.user_id))
      ])];
      await fetchProfiles(userIds);

      // Process parent messages and replies
      const newMessages = (data || []).filter(
        newMsg => !messagesMap.has(newMsg.id)
      );

      setMessageIds(prev => {
        // Filter out any duplicate IDs
        const uniqueNewIds = newMessages.map(msg => msg.id)
          .filter(id => !prev.includes(id));
        return [...prev, ...uniqueNewIds];
      });
      
      setMessagesMap(prev => {
        const newMap = new Map(prev);
        
        // Add parent messages
        newMessages.forEach(msg => {
          const replies = msg.replies as Message[];
          newMap.set(msg.id, {
            ...msg,
            replies: replies?.map((reply: Message) => reply.id) || []
          });
          
          // Add replies to map
          replies?.forEach((reply: Message) => {
            if (!newMap.has(reply.id)) {
              newMap.set(reply.id, reply);
            }
          });
        });
        
        return newMap;
      });
      
      setHasMore(data?.length === PAGE_SIZE);
    } catch (error: any) {
      toast({
        title: 'Error fetching messages',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false);
    }
  }

  // Filter out duplicate message IDs while preserving order
  const uniqueMessageIds = useMemo(() => {
    return [...new Set(messageIds)];
  }, [messageIds]);

  return (
    <div className="flex-grow overflow-y-auto flex flex-col-reverse">
      <div ref={messagesEndRef} />
      <div className="flex-grow"></div>
      {uniqueMessageIds.map((messageId, index) => {
        const message = messagesMap.get(messageId);
        if (!message) return null;
        return (
          <ChatMessage 
            key={messageId} 
            user={user} 
            message={message} 
            profiles={profiles} 
            handleUserClick={handleUserClick} 
            onOpenThread={onOpenThread} 
            onAddReaction={addReaction} 
            onRemoveReaction={removeReaction} 
          />
        );
      })}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center p-4">
          {isLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}
        </div>
      )}
    </div>
  );
}