'use client'

import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { v4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import ChatInput from "./chat-input";
import ChatMessages from "./chat-messages";
import { useState } from "react";
import ChannelHeader from "./header";
import { Channel, Message, Profile } from "@/types/types";
import { ChatThread } from "./chat-thread";
import { UserProfile } from "./user-profile";

export default function ChatContainer({user, channel} : {user: User, channel: Channel}) {
  const { toast } = useToast()
  const supabase = createClient()
  const [mainChatEnabled, setMainChatEnabled] = useState(true)
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [messagesMap, setMessagesMap] = useState<Map<string, Message>>(new Map());
  const [threadMessageId, setThreadMessageId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Fetch profiles for new user IDs
  async function fetchNewProfiles(userIds: string[]) {
    const newUserIds = userIds.filter(id => !profiles.has(id));
    
    if (newUserIds.length === 0) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, status')
      .in('id', newUserIds);

    if (error) {
      toast({
        title: 'Error fetching profiles',
        description: error.message,
        variant: 'destructive',
      })
      return;
    }

    setProfiles(prev => {
      const newMap = new Map(prev);
      data?.forEach(profile => {
        newMap.set(profile.id, profile);
      });
      return newMap;
    });
  }

  async function onSendMessage(message: string, setChatEnabled: (enabled: boolean) => void, files?: File[], parentId?: string) {
    if ((!message.trim()) || !user) return;
    setChatEnabled(false)

    let uploadedFiles : {fileUrl: string, fileName: string, index: number}[] = []
    if(files) {
      uploadedFiles = (await Promise.all(files.map(async (file, index) => {
        const filePath = `${channel.id}/${v4()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('message-attachments')
          .upload(filePath, file);

        if (error) {
          console.error('Error uploading file:', error);
          toast({
            title: "Failed to upload file",
            description: error.message,
            variant: "destructive",
          });
        }
  
        if (data) {
          const { data: urlData } = supabase.storage
            .from('message-attachments')
            .getPublicUrl(filePath);
  
          const fileUrl = urlData.publicUrl;
          const fileName = file.name;
          return { fileUrl, fileName, index }  
        }
      }))).filter((file) => file !== undefined)
    }

    const processedFiles = uploadedFiles.sort((a, b) => a.index - b.index).map((file) => ({
      file_url: file.fileUrl,
      file_name: file.fileName,
    }))

    try {
      const { data, error } = await supabase
        .rpc(channel.type == "direct" ? 'create_direct_message' : 'insert_message_with_attachments', {
          channel_id: channel.id,
          user_id: user.id,
          message: message,
          parent_id: parentId || null,
          files: processedFiles.length > 0 ? processedFiles : null
        })
        .single();

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Unable to send message",
        description: error.message,
        variant: "destructive",
      });
      return {status: 'error', message: error.message}
    } finally {
      setChatEnabled(true)
    }
  }

  const removeReaction = (deletedId: string) => {
    setMessagesMap(prev => {
      const newMap = new Map(prev);
      for (const [messageId, message] of newMap) {
        newMap.set(messageId, {
          ...message,
          message_reactions: message.message_reactions?.filter(
            reaction => reaction.id !== deletedId
          ) || []
        });
      }
      return newMap;
    });
  }

  const addReaction = (id: string, messageId: string, userId: string, newReaction: string, createdAt: string) => {    
    setMessagesMap(prev => {
      const newMap = new Map(prev);
      const message = newMap.get(messageId);
      if (message) {
        const hasExistingReaction = message.message_reactions?.some(
          reaction => 
            reaction.user_id === userId && 
            reaction.reaction === newReaction
        );

        if (!hasExistingReaction) {
          newMap.set(messageId, {
            ...message,
            message_reactions: [
              ...(message.message_reactions || []),
              {
                id: id,
                user_id: userId,
                reaction: newReaction,
                created_at: createdAt
              }
            ]
          });
          fetchNewProfiles([userId]);
        }
      }
      return newMap;
    });
  }

  async function onOpenThread(messageId: string) {
    setThreadMessageId(messageId)
  }

  function handleUserClick(userId: string) {
    setSelectedUserId(userId)
  }

  function handleCloseThread() {
    setThreadMessageId(null)
  }

  function handleCloseProfile() {
    setSelectedUserId(null)
  }

  return <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-background">
    <ChannelHeader user={user} channel={channel}/>
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-col flex-1">
        <ChatMessages 
          user={user} 
          channelId={channel.id} 
          profiles={profiles} 
          fetchProfiles={fetchNewProfiles} 
          messagesMap={messagesMap} 
          setMessagesMap={setMessagesMap} 
          onOpenThread={onOpenThread} 
          removeReaction={removeReaction} 
          addReaction={addReaction}
          handleUserClick={handleUserClick}
        />
        <ChatInput onSendMessage={(message: string, files?: File[], parentId?: string) => onSendMessage(message, setMainChatEnabled, files, parentId)} active={mainChatEnabled} />
      </div>
      {threadMessageId && (
        <div className="w-[400px] border-l flex flex-col">
          <ChatThread
            user={user}
            parentMessageId={threadMessageId}
            messagesMap={messagesMap}
            profiles={profiles}
            addReaction={addReaction}
            removeReaction={removeReaction}
            onSendMessage={onSendMessage}
            handleUserClick={handleUserClick}
            handleCloseThread={handleCloseThread}
          />
        </div>
      )}
      {selectedUserId && (
        <div className="w-[400px] border-l flex flex-col">
          <UserProfile 
            userId={selectedUserId}
            profiles={Object.fromEntries(profiles)}
            handleCloseProfile={handleCloseProfile}
          />
        </div>
      )}
    </div>
  </div>
}
