'use client'

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import UserAvatar from "../user-avatar/user-avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Send, Loader2 } from "lucide-react"
import { FormEvent, useState } from "react"
import { sendMessage } from "./actions"

interface Profile {
  id: string
  name: string
  email: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AvatarChatProps {
  avatarProfile: Profile
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function AvatarChat({ avatarProfile, isOpen, onOpenChange }: AvatarChatProps) {
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Send me a message to get started!"
  }])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || isLoading) return
    
    // Add user message immediately
    const userMessage: Message = {
      role: 'user',
      content: newMessage.trim()
    }
    setMessages(prev => [...prev, userMessage])
    setNewMessage('')
    setIsLoading(true)

    try {
      const result = await sendMessage(avatarProfile.id, userMessage.content)
      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: result
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      // Add error message if request fails
      const errorMessage: Message = {
        role: 'assistant',
        content: "Sorry, I encountered an error processing your request. Please try again."
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <VisuallyHidden asChild>
          <DialogTitle>Open Avatar Chat</DialogTitle>
        </VisuallyHidden>
        <Card className="w-full h-[37rem] flex flex-col border-0">
          <CardHeader className="flex flex-row items-center gap-3 flex-shrink-0">
            <Avatar className="h-8 w-8 rounded-md">
              <UserAvatar name={avatarProfile.name} email={avatarProfile.email} />
            </Avatar>
            <div className="flex flex-col !mt-0">
              <h3 className="font-semibold text-sm">{avatarProfile.name} AI</h3>
              <p className="text-xs text-muted-foreground">{avatarProfile.email}</p>
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden p-6 pt-0">
            <ScrollArea className="h-full pr-4">
              <div className="flex flex-col gap-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`rounded-lg px-3 py-2 max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex-shrink-0 flex flex-col gap-2">
            <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
              <Input
                placeholder="Type your message..."
                className="flex-1"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={isLoading}
              />
              <Button size="icon" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">Avatar chats are not saved. {avatarProfile.name} AI isn't real and can't hurt you.</p>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
