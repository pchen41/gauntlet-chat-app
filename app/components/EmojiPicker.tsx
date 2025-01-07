'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Smile } from 'lucide-react'
import { cn } from "@/lib/utils"

const commonEmojis = ['😀', '😂', '😍', '😎', '👍', '👎', '🤔', '❤️', '🔥', '🎉']

type EmojiPickerProps = {
  onEmojiSelect: (emoji: string) => void
  className?: string
}

export function EmojiPicker({ onEmojiSelect, className }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("p-0 h-8 w-8", className)}>
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="grid grid-cols-5 gap-2 p-2">
          {commonEmojis.map(emoji => (
            <Button
              key={emoji}
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

