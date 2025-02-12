'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Smile } from 'lucide-react'
import { cn } from "@/lib/utils"

const commonEmojis = ['😀', '😂', '😍', '😎', '👍', '👎', '🤔', '❤️', '🔥', '🎉', '✨', '💯', '🙏', '💪', '🤣', '😅', '😭', '🥺', '☹️', '😴', '🎯', '🚀', '💡', '👋']

type EmojiPickerProps = {
  onEmojiSelect: (emoji: string) => void
  className?: string
  disabled?: boolean
}

export function EmojiPicker({ onEmojiSelect, className, disabled }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("p-0 h-8 w-8", className)}
          disabled={disabled}
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="grid grid-cols-6 gap-2 p-2">
          {commonEmojis.map((emoji, index) => (
            <Button
              key={index}
              variant="ghost"
              className="text-lg p-2 h-10"
              onClick={() => {
                onEmojiSelect(emoji)
                setIsOpen(false)
              }}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
