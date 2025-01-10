'use client'

import { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Message, Profile } from "@/types/types"
import ChatMessage from "./chat-message"
import ChatInput from "./chat-input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface ChatThreadProps {
  user: User
  parentMessageId: string
  messagesMap: Map<string, Message>
  profiles: Map<string, Profile>
  addReaction: (id: string, messageId: string, userId: string, reaction: string, createdAt: string) => void
  removeReaction: (id: string) => void
  onSendMessage: (message: string, setChatEnabled: (enabled: boolean) => void, files?: File[], parentId?: string) => Promise<{status: string, message?: string} | void>
  handleUserClick: (userId: string) => void
  handleCloseThread: () => void
}

export function ChatThread({
  user,
  parentMessageId,
  messagesMap,
  profiles,
  addReaction,
  removeReaction,
  handleUserClick,
  onSendMessage,
  handleCloseThread
}: ChatThreadProps) {
  const [threadChatEnabled, setThreadChatEnabled] = useState(true)
  const parentMessage = messagesMap.get(parentMessageId)
  if (!parentMessage) {
    return <div className="p-4">Thread not found</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 pl-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Thread</h3>
        <Button variant="ghost" size="icon" onClick={handleCloseThread}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto flex flex-grow flex-col">
        <div className="space-y-4">
          <div className="p-2 bg-muted/50 border-b border-muted">
            <ChatMessage 
              message={parentMessage}
              user={user}
              profiles={profiles}
              handleUserClick={handleUserClick}
              onAddReaction={addReaction}
              onRemoveReaction={removeReaction}
            />
          </div>
          <div className="pl-2 space-y-4">
            {parentMessage.replies?.map((messageId, index) => {
              const message = messagesMap.get(messageId)
              if (!message) return null
              return <ChatMessage
                key={index}
                message={message}
                user={user}
                profiles={profiles}
                handleUserClick={handleUserClick}
                onAddReaction={addReaction}
                onRemoveReaction={removeReaction}
              />
            })}
          </div>
        </div>
      </div>
      <div>
        <ChatInput 
          onSendMessage={(message, files) => onSendMessage(message, setThreadChatEnabled, files, parentMessageId)}
          active={threadChatEnabled}
        />
      </div>
    </div>
  )
}
