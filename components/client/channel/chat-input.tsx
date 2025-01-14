'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "@supabase/supabase-js";
import { FileIcon, Loader2, Paperclip, Send, X } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { EmojiPicker } from "./emoji-picker";

export default function ChatInput({active, onSendMessage} : {active: boolean, onSendMessage: (message: string, files?: File[]) => Promise<{status: string, message?: string} | void>}) {
  const [newMessage, setNewMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles(prev => {
        const uniqueFiles = newFiles.filter(newFile => 
          !prev.some(existingFile => 
            existingFile.name === newFile.name && 
            existingFile.size === newFile.size
          )
        )
        return [...prev, ...uniqueFiles]
      })
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    if (files.length === 1 && fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    setCursorPosition(e.target.selectionStart || 0)
  }

  const insertEmoji = (emoji: string) => {
    const start = cursorPosition
    const end = cursorPosition
    const newValue = newMessage.substring(0, start) + emoji + newMessage.substring(end)
    setNewMessage(newValue)
    
    // Set cursor position after emoji
    const newPosition = start + emoji.length
    setCursorPosition(newPosition)
    
    // Focus input and set cursor position
    if (inputRef.current) {
      inputRef.current.focus()
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = newPosition
          inputRef.current.selectionEnd = newPosition
        }
      }, 0)
    }
  }

  async function sendMessage(e: React.FormEvent | React.KeyboardEvent) {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return

    if(active) {
      setIsLoading(true)
      try {
        const result = await onSendMessage(newMessage, files.length > 0 ? files : undefined)
        if (result?.status !== 'error') {
          setNewMessage('')
          setFiles([])
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
        }
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <form onSubmit={(e) => sendMessage(e)} className="sticky bottom-0 p-4 border-t bg-background">
      <div className="flex items-center space-x-2">
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={triggerFileInput}
          disabled={isLoading}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          disabled={isLoading}
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={handleInputChange}
          onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart || 0)}
          onKeyUp={(e: any) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(e);
            }
          }}
          className="flex-grow"
          disabled={isLoading}
        />
        <EmojiPicker 
          onEmojiSelect={insertEmoji}
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center space-x-2 border rounded-md p-2">
              <FileIcon className="h-4 w-4" />
              <span className="text-sm">{file.name}</span>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="w-2"
                onClick={() => removeFile(index)}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </form>
  )
}