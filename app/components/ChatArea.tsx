'use client'

import { useState, useEffect, useRef, ChangeEvent, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { supabase } from '@/utils/supabase-client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Paperclip, MessageSquare, MessageCircle, X, FileIcon } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from "@/components/ui/use-toast"
import { ChannelHeader } from './ChannelHeader'
import { UserSidebar } from './UserSidebar'
import { EmojiPicker } from './EmojiPicker'
import { ScrollArea } from "@/components/ui/scroll-area"
import { v4 as uuidv4 } from 'uuid'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

function debounce<F extends (...args: any[]) => any>(func: F, wait: number): (...args: Parameters<F>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<F>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}


type Reaction = {
  emoji: string
  count: number
  users: string[]
}

type Message = {
  id: string
  content: string
  created_at: string
  user_id: string
  user_name: string
  parent_id: string | null
  reactions: Reaction[]
  file_url?: string
  file_name?: string
}

type ChatAreaProps = {
  channelId: string
}

type UserDetails = {
  id: string
  name: string
  email: string
  status: string
} | null


const MemoizedAvatar = memo(({ userName }: { userName: string }) => (
  <Avatar className="h-8 w-8 rounded-md flex-shrink-0">
    <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${userName}`} />
    <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
  </Avatar>
))

type MessageContentProps = {
  message: Message;
  threadMessage: Message | null;
  onOpenThread: (message: Message) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
  user: any;
  messages: Message[];
  countReplies: (messageId: string) => number;
};

const MessageContent = memo(({ message, threadMessage, onOpenThread, onAddReaction, onRemoveReaction, user, messages, countReplies }: MessageContentProps) => {
  const handleReactionClick = (emoji: string) => {
    const existingReaction = message.reactions.find(r => r.emoji === emoji && r.users.includes(user?.id ?? ''))
    if (existingReaction) {
      onRemoveReaction(message.id, emoji)
    } else {
      onAddReaction(message.id, emoji)
    }
  }

  return (
    <div className="flex items-start space-x-3 group">
      <MemoizedAvatar userName={message.user_name} />
      <div className="flex-grow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span 
              className="font-semibold cursor-pointer hover:underline"
              onClick={() => handleUserClick(message.user_id)}
            >
              {message.user_name}
            </span>
            <span className="text-xs text-muted-foreground" title={format(new Date(message.created_at), 'PPpp')}>
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <EmojiPicker 
              onEmojiSelect={(emoji) => onAddReaction(message.id, emoji)} 
              className="h-8"
            />
            {!message.parent_id && !threadMessage && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onOpenThread(message)}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Reply
              </Button>
            )}
          </div>
        </div>
        <p className="mt-1">{message.content}</p>
        {message.file_url && (
          <div className="mt-2">
            <a href={message.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-blue-600 hover:underline">
              <FileIcon className="h-4 w-4" />
              <span>{message.file_name}</span>
            </a>
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-1 items-center">
          {message.reactions.map(reaction => (
            <TooltipProvider key={`tooltip-${message.id}-${reaction.emoji}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`px-2 py-0 h-8 ${reaction.users.includes(user?.id ?? '') ? 'bg-accent' : ''}`}
                    onClick={() => handleReactionClick(reaction.emoji)}
                  >
                    {reaction.emoji} {reaction.count}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {reaction.users.map(userId => {
                    const reactingUser = messages.find(m => m.user_id === userId)?.user_name || 'Unknown User'
                    return <div key={`${message.id}-${reaction.emoji}-${userId}`}>{reactingUser}</div>
                  })}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        {!message.parent_id && countReplies(message.id) > 0 && (
          <div 
            className="mt-2 text-sm text-blue-600 cursor-pointer flex items-center"
            onClick={() => onOpenThread(message)}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            {countReplies(message.id)} {countReplies(message.id) === 1 ? 'reply' : 'replies'}
          </div>
        )}
      </div>
    </div>
  )
})

const MemoizedMessageContent = memo(MessageContent)

export default function ChatArea({ channelId }: ChatAreaProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [threadMessage, setThreadMessage] = useState<Message | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [channelName, setChannelName] = useState('')
  const [channelType, setChannelType] = useState<'public' | 'private' | 'direct'>('public')
  const [selectedUser, setSelectedUser] = useState<UserDetails>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [threadReply, setThreadReply] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchMessages()
    checkChannelMembership()
    fetchChannelInfo()
    
    const messageSubscription = supabase
      .channel(`public:messages:channel_id=eq.${channelId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `channel_id=eq.${channelId}` 
        }, 
        (payload) => {
          handleNewMessage(payload.new as Message)
        }
      )
      .subscribe()

    const reactionSubscription = supabase
      .channel('public:message_reactions')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'message_reactions'
        }, 
        (payload) => {
          handleReactionChange(payload)
        }
      )
      .subscribe()

    return () => {
      messageSubscription.unsubscribe()
      reactionSubscription.unsubscribe()
    }
  }, [channelId])

  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
  }, [messages])

  async function fetchMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles:user_id (name)
      `)
      .eq('channel_id', channelId)
      .order('created_at')

    if (error) {
      console.error('Error fetching messages:', error)
    } else if (data) {
      const messagesWithNames = data.map(message => ({
        ...message,
        user_name: message.profiles.name || 'Anonymous',
        reactions: []
      }))
      const messageIds = messagesWithNames.map(m => m.id)
      const reactions = await fetchReactions(messageIds)
      const messagesWithReactions = messagesWithNames.map(message => ({
        ...message,
        reactions: reactions[message.id] || []
      }))
      setMessages(messagesWithReactions)
    }
  }

  async function checkChannelMembership() {
    if (!user) return;

    const { data, error } = await supabase
      .from('channel_members')
      .select('*')
      .eq('channel_id', channelId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error checking channel membership:', error);
    } else {
      setIsMember(data.length > 0);
    }
  }

  async function fetchChannelInfo() {
    const { data, error } = await supabase
      .from('channels')
      .select('name, type')
      .eq('id', channelId)
      .single()

    if (error) {
      console.error('Error fetching channel info:', error)
    } else if (data) {
      if (data.type === 'direct') {
        fetchChannelMembers()
      } else {
        setChannelName(data.name)
      }
      setChannelType(data.type)
    }
  }

  async function handleNewMessage(newMessage: Message) {
    const { data, error } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', newMessage.user_id)
      .single()

    if (error) {
      console.error('Error fetching user name:', error)
      return
    }

    const messageWithName = { ...newMessage, user_name: data.name || 'Anonymous', reactions: [] }

    setMessages(prevMessages => {
      const messageExists = prevMessages.some(msg => msg.id === messageWithName.id)
      if (messageExists) {
        return prevMessages
      }
      return [...prevMessages, messageWithName]
    })

    if (messageWithName.parent_id && threadMessage && messageWithName.parent_id === threadMessage.id) {
      setThreadMessage(prevThreadMessage => ({
        ...prevThreadMessage!,
        replies: [...(prevThreadMessage?.replies || []), messageWithName],
      }));
    }
  }

  async function handleReactionChange(payload: any) {
    const { eventType, new: newReaction, old: oldReaction } = payload

    setMessages(prevMessages => {
      return prevMessages.map(message => {
        if (message.id === newReaction.message_id) {
          let updatedReactions = [...message.reactions]

          if (eventType === 'INSERT') {
            const existingReaction = updatedReactions.find(r => r.emoji === newReaction.emoji)
            if (existingReaction) {
              existingReaction.count++
              existingReaction.users.push(newReaction.user_id)
            } else {
              updatedReactions.push({ emoji: newReaction.emoji, count: 1, users: [newReaction.user_id] })
            }
          } else if (eventType === 'DELETE') {
            updatedReactions = updatedReactions.map(r => {
              if (r.emoji === oldReaction.emoji) {
                return {
                  ...r,
                  count: r.count - 1,
                  users: r.users.filter(userId => userId !== oldReaction.user_id)
                }
              }
              return r
            }).filter(r => r.count > 0)
          }

          return { ...message, reactions: updatedReactions }
        }
        return message
      })
    })
  }

  const debouncedSendMessage = debounce(sendMessage, 500)

  async function sendMessage(e: React.FormEvent | React.KeyboardEvent, parentId: string | null = null) {
    e.preventDefault();
    const messageContent = parentId ? threadReply : newMessage;
    if ((!messageContent.trim() && !file) || !user || !isMember) return;

    let fileUrl = '';
    let fileName = '';

    if (file) {
      const filePath = `${channelId}/${uuidv4()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('message-attachments')
        .upload(filePath, file);

      if (error) {
        console.error('Error uploading file:', error);
        toast({
          title: "Error",
          description: "Failed to upload file",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        const { data: urlData } = supabase.storage
          .from('message-attachments')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileName = file.name;
      }
    }

    const newMessageObject = {
      content: messageContent,
      channel_id: channelId,
      user_id: user.id,
      parent_id: parentId,
      file_url: fileUrl,
      file_name: fileName,
    };

    if (parentId) {
      setThreadReply('');
    } else {
      setNewMessage('');
      setFile(null);
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([newMessageObject])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const messageWithName = {
          ...data,
          user_name: user.user_metadata?.name || 'Anonymous',
          reactions: [],
        };

        setMessages(prevMessages => [...prevMessages, messageWithName]);

        if (parentId && threadMessage) {
          setThreadMessage(prevThreadMessage => ({
            ...prevThreadMessage!,
            replies: [...(prevThreadMessage?.replies || []), messageWithName],
          }));
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  }

  function openThread(message: Message) {
    setThreadMessage(message);
    setThreadReply('');
  }

  function closeThread() {
    setThreadMessage(null)
  }

  function countReplies(messageId: string) {
    return messages.filter(m => m.parent_id === messageId).length;
  }

  function handleLeaveChannel() {
    router.push('/client/dashboard')
  }

  async function handleUserClick(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, status')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user details:', error)
      toast({
        title: "Error",
        description: "Failed to fetch user details",
        variant: "destructive",
      })
    } else if (data) {
      setSelectedUser(data)
    }
  }

  async function fetchReactions(messageIds: string[]) {
    const { data, error } = await supabase
      .from('message_reactions')
      .select('message_id, emoji, user_id')
      .in('message_id', messageIds)

    if (error) {
      console.error('Error fetching reactions:', error)
      return {}
    }

    const reactionsByMessage: { [messageId: string]: Reaction[] } = {}
    data.forEach(reaction => {
      if (!reactionsByMessage[reaction.message_id]) {
        reactionsByMessage[reaction.message_id] = []
      }
      const existingReaction = reactionsByMessage[reaction.message_id].find(r => r.emoji === reaction.emoji)
      if (existingReaction) {
        existingReaction.count++
        existingReaction.users.push(reaction.user_id)
      } else {
        reactionsByMessage[reaction.message_id].push({ emoji: reaction.emoji, count: 1, users: [reaction.user_id] })
      }
    })

    return reactionsByMessage
  }

  async function addReaction(messageId: string, emoji: string) {
    if (!user) return

    // Check if the reaction already exists
    const existingReaction = messages
      .find(m => m.id === messageId)
      ?.reactions.find(r => r.emoji === emoji && r.users.includes(user.id))

    if (existingReaction) {
      console.log('Reaction already exists')
      return
    }

    const { data, error } = await supabase
      .from('message_reactions')
      .insert({ message_id: messageId, user_id: user.id, emoji })

    if (error) {
      console.error('Error adding reaction:', error)
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      })
    }
  }

  async function removeReaction(messageId: string, emoji: string) {
    if (!user) return

    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .match({ message_id: messageId, user_id: user.id, emoji })

    if (error) {
      console.error('Error removing reaction:', error)
      toast({
        title: "Error",
        description: "Failed to remove reaction",
        variant: "destructive",
      })
    } else {
      // Optimistically update the UI
      setMessages(prevMessages => 
        prevMessages.map(message => 
          message.id === messageId
            ? {
                ...message,
                reactions: message.reactions.map(reaction => 
                  reaction.emoji === emoji
                    ? {
                        ...reaction,
                        count: reaction.count - 1,
                        users: reaction.users.filter(id => id !== user.id)
                      }
                    : reaction
                ).filter(reaction => reaction.count > 0)
              }
            : message
        )
      )
    }
  }


  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const memoizedMessages = useMemo(() => messages, [messages])

  async function fetchChannelMembers() {
    const { data, error } = await supabase
      .from('channel_members')
      .select('user_id, profiles:user_id(name)')
      .eq('channel_id', channelId)

    if (error) {
      console.error('Error fetching channel members:', error)
    } else if (data) {
      const memberNames = data
        .map(member => member.profiles.name)
        .filter(name => name !== user?.user_metadata?.name)
      setChannelName(memberNames.join(', '))
    }
  }

  async function hideChannel() {
    if (!user) return

    const { error } = await supabase
      .from('channel_members')
      .update({ hidden: true })
      .eq('channel_id', channelId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error hiding channel:', error)
      toast({
        title: "Error",
        description: "Failed to hide channel",
        variant: "destructive",
      })
    } else {
      router.push('/client/dashboard')
    }
  }

  if (!isMember) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">You are not a member of this channel.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b">
        <ChannelHeader 
          channelId={channelId}
          channelName={channelName}
          channelType={channelType}
          onLeaveChannel={channelType === 'direct' ? hideChannel : handleLeaveChannel}
          leaveButtonText={channelType === 'direct' ? 'Hide' : 'Leave Channel'}
        />
      </div>
      <div className="flex-grow flex overflow-y-auto">
        <div className="flex-grow flex flex-col">
          <ScrollArea className="flex-grow overflow-auto pl-4 pr-4 max-h-[calc(100vh-8rem)]">
            {memoizedMessages.filter(m => !m.parent_id).map(message => (
              <div key={message.id} className="mb-4 group">
                <div className="bg-card p-3 rounded-lg shadow-sm">
                  <MemoizedMessageContent 
                    message={message} 
                    threadMessage={threadMessage}
                    onOpenThread={openThread}
                    onAddReaction={addReaction}
                    onRemoveReaction={removeReaction}
                    user={user}
                    messages={messages}
                    countReplies={countReplies}
                  />
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </ScrollArea>
          <form onSubmit={(e) => debouncedSendMessage(e)} className="sticky bottom-0 p-4 border-t bg-background">
            <div className="flex items-center space-x-2">
              <Button type="button" variant="ghost" size="icon" onClick={triggerFileInput}>
                <Paperclip className="h-5 w-5" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <Input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    debouncedSendMessage(e);
                  }
                }}
                className="flex-grow"
              />
              <EmojiPicker onEmojiSelect={(emoji) => setNewMessage(prev => prev + emoji)} />
              <Button type="submit" size="icon">
                <Send className="h-5 w-5" />
              </Button>
            </div>
            {file && (
              <div className="mt-2 flex items-center space-x-2">
                <FileIcon className="h-4 w-4" />
                <span className="text-sm">{file.name}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </form>
        </div>
        {threadMessage && (
          <div className="w-1/3 border-l flex flex-col h-full bg-card">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Thread</h2>
              <Button variant="ghost" size="icon" onClick={closeThread}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-grow overflow-auto p-4">
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <MemoizedMessageContent 
                  message={threadMessage} 
                  threadMessage={threadMessage}
                  onOpenThread={openThread}
                  onAddReaction={addReaction}
                  onRemoveReaction={removeReaction}
                  user={user}
                  messages={messages}
                  countReplies={countReplies}
                />
              </div>
              {messages.filter(m => m.parent_id === threadMessage.id).map(reply => (
                <div key={reply.id} className="mb-4">
                  <MemoizedMessageContent 
                    message={reply} 
                    threadMessage={threadMessage}
                    onOpenThread={openThread}
                    onAddReaction={addReaction}
                    onRemoveReaction={removeReaction}
                    user={user}
                    messages={messages}
                    countReplies={countReplies}
                  />
                </div>
              ))}
            </ScrollArea>
            <form onSubmit={(e) => sendMessage(e, threadMessage.id)} className="sticky bottom-0 p-4 border-t bg-card">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Reply to thread..."
                  value={threadReply}
                  onChange={(e) => setThreadReply(e.target.value)}
                  className="flex-grow"
                />
                <Button type="submit" size="icon">
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </div>
        )}
        {selectedUser && (
          <UserSidebar user={selectedUser} onClose={() => setSelectedUser(null)} />
        )}
      </div>
    </div>
  )
}

