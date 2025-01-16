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
import { Send, Loader2, Mic } from "lucide-react"
import { FormEvent, useState, useRef, useEffect } from "react"
import { sendMessage } from "./actions"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { SpeechRecognitionManager, createSpeechRecognition } from "@/lib/speech-recognition"
import { SpeechSynthesisManager, createSpeechSynthesis } from "@/lib/speech-synthesis"

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
  const [isAudioMode, setIsAudioMode] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Send me a message to get started!"
  }])
  const audioModeStartTimeRef = useRef<number>(0)
  const lastMessageTimeRef = useRef<number>(0)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const speechRecognitionRef = useRef<SpeechRecognitionManager | null>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisManager | null>(null)

  // Initialize speech synthesis
  useEffect(() => {
    speechSynthesisRef.current = createSpeechSynthesis();
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    speechRecognitionRef.current = createSpeechRecognition(
      async (transcript, isFinal) => {
        setNewMessage(transcript);
        // If it's a final transcript and in audio mode, send the message
        if (isFinal && isAudioMode && transcript.trim()) {
          await handleSubmit(null, transcript.trim());
        }
      },
      (isListening) => setIsListening(isListening)
    );

    return () => {
      speechRecognitionRef.current?.cleanup();
    };
  }, [isAudioMode]);

  // Handle audio mode changes
  useEffect(() => {
    if (isAudioMode && !isListening && speechRecognitionRef.current) {
      audioModeStartTimeRef.current = Date.now();
      speechRecognitionRef.current.startListening();
    } else if (!isAudioMode && isListening && speechRecognitionRef.current) {
      speechRecognitionRef.current.stopListening();
      setNewMessage(''); // Clear the input when turning off audio mode
    }

    // Stop any ongoing speech when audio mode is toggled off
    if (!isAudioMode && speechSynthesisRef.current) {
      speechSynthesisRef.current.stop();
    }
  }, [isAudioMode, isListening]);

  // Speak assistant messages in audio mode
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (isAudioMode && 
        lastMessage?.role === 'assistant' && 
        speechSynthesisRef.current && 
        lastMessageTimeRef.current > audioModeStartTimeRef.current) {
      speechSynthesisRef.current.speak(lastMessage.content);
    }
  }, [messages, isAudioMode]);

  // Add scroll listener to track if user is at bottom
  useEffect(() => {
    const scrollArea = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (!scrollArea) return

    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = scrollArea
      isAtBottomRef.current = scrollHeight - (scrollTop + clientHeight) < 10
    }

    scrollArea.addEventListener('scroll', handleScroll)
    return () => scrollArea.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll to bottom when messages change if user was at bottom
  useEffect(() => {
    const scrollArea = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (!scrollArea || !isAtBottomRef.current) return

    scrollArea.scrollTo({
      top: scrollArea.scrollHeight,
      behavior: 'smooth'
    })
  }, [messages])

  // Handle modal close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Stop audio mode
      setIsAudioMode(false);
      // Stop any ongoing speech
      speechSynthesisRef.current?.stop();
      // Stop speech recognition
      speechRecognitionRef.current?.cleanup();
    }
    onOpenChange(open);
  };

  async function handleSubmit(e: FormEvent | null, overrideMessage?: string) {
    if (e) e.preventDefault();
    const messageToSend = overrideMessage || newMessage;
    if (!messageToSend.trim() || isLoading) return;
    
    // Add user message immediately
    const userMessage: Message = {
      role: 'user',
      content: messageToSend.trim()
    }
    setMessages(prev => [...prev, userMessage])
    setNewMessage('')
    setIsLoading(true)

    try {
      const result = await sendMessage(avatarProfile.id, userMessage.content, messages.slice(-10))
      // Add assistant response and update timestamp
      lastMessageTimeRef.current = Date.now();
      const assistantMessage: Message = {
        role: 'assistant',
        content: result
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      // Add error message if request fails
      lastMessageTimeRef.current = Date.now();
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
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0">
        <VisuallyHidden asChild>
          <DialogTitle>Open Avatar Chat</DialogTitle>
        </VisuallyHidden>
        <Card className="w-full h-[37rem] flex flex-col border-0">
          <CardHeader className="flex flex-row items-center gap-3 flex-shrink-0">
            <div className="flex flex-row items-center gap-3">
              <Avatar className="h-8 w-8 rounded-md">
                <UserAvatar name={avatarProfile.name} email={avatarProfile.email} />
              </Avatar>
              <div className="flex flex-col !mt-0">
                <h3 className="font-semibold text-sm">{avatarProfile.name} AI</h3>
                <p className="text-xs text-muted-foreground">{avatarProfile.email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden p-6 pt-0">
            <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
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
            <form onSubmit={(e) => handleSubmit(e)} className="flex w-full flex-col gap-2">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Mic className="h-4 w-4 text-muted-foreground" />
                        <Switch
                          checked={isAudioMode}
                          onCheckedChange={setIsAudioMode}
                          aria-label="Toggle conversational mode"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Toggle conversational mode. You can speak to {avatarProfile.name} AI and it will reply back.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex w-full items-center gap-2">
                <Input
                  placeholder={isAudioMode ? "Listening for speech..." : "Type your message..."}
                  className={cn(
                    "flex-1",
                    isAudioMode && "border-green-500 focus-visible:ring-green-500"
                  )}
                  value={newMessage}
                  onChange={(e) => !isAudioMode && setNewMessage(e.target.value)}
                  disabled={isLoading || isAudioMode}
                  readOnly={isAudioMode}
                />
                <Button size="icon" type="submit" disabled={isLoading || (isAudioMode && isListening)}>
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </form>
            <p className="text-xs text-muted-foreground">Avatar chats are not saved. {avatarProfile.name} AI isn't real and can't hurt you.</p>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
