'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "@supabase/supabase-js";
import { FileIcon, Paperclip, Send, X } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { EmojiPicker } from "./emoji-picker";

export default function ChatInput({active, onSendMessage} : {active: boolean, onSendMessage: (message: string, files?: File[]) => Promise<{status: string, message?: string} | void>}) {
  const [newMessage, setNewMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {

    console.log('setting file', e.target.files)
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  async function sendMessage(e: React.FormEvent | React.KeyboardEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return

    if(active) {
      const result = await onSendMessage(newMessage, file ? [file] : undefined)
      if (result?.status !== 'error') {
        setNewMessage('')
        setFile(null)
      }
    }
  }

  return (
    <form onSubmit={(e) => sendMessage(e)} className="sticky bottom-0 p-4 border-t bg-background">
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
          onChange={(e: any) => setNewMessage(e.target.value)}
          onKeyUp={(e: any) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(e);
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
          <Button type="button" variant="ghost" size="sm" className="w-2"onClick={() => {setFile(null); fileInputRef.current && (fileInputRef.current.value = "")}}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </form>
  )
}