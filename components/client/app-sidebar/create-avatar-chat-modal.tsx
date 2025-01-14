'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User } from "@supabase/supabase-js"
import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar } from "@/components/ui/avatar"
import UserAvatar from "../user-avatar/user-avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AvatarChat } from "@/components/client/avatar-chat/avatar-chat"

interface Profile {
  id: string
  name: string
  email: string
}

interface CreateAvatarChatModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: User
}

export function CreateAvatarChatModal({ isOpen, onClose, currentUser }: CreateAvatarChatModalProps) {
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searchValue, setSearchValue] = useState('')
  const supabase = createClient()
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const [isAvatarChatOpen, setIsAvatarChatOpen] = useState(false)

  async function performSearch(search: string) {
    if (search.length < 2) {
      setSearchResults([])
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, name, email')
      .neq('id', currentUser.id)
      .or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      .limit(10)
    
    setSearchResults(data || [])
  }

  function handleSearch(search: string) {
    setSearchValue(search)
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    searchTimeout.current = setTimeout(() => {
      performSearch(search)
    }, 300)
  }

  function handleClose() {
    setSearchResults([])
    setSearchValue('')
    setSelectedUser(null)
    onClose()
  }

  function handleSubmit() {
    if (!selectedUser) return
    setIsAvatarChatOpen(true)
    onClose()
  }

  function handleAvatarChatOpenChange(open: boolean) {
    setIsAvatarChatOpen(open)
    if (!open) {
      setIsAvatarChatOpen(false)
      setSelectedUser(null)
    }
  }

  const borderRounding = searchResults.length > 0 ? 'rounded-t-md' : 'rounded-md'

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Chat with an avatar</DialogTitle>
            <DialogDescription>Avatars are AI bots that simulate other users</DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4">
            <div className="relative">
              <div className={"flex flex-wrap gap-2 min-h-[40px] p-2 border items-center " + borderRounding}>
                {selectedUser && (
                  <TooltipProvider>
                    <Tooltip delayDuration={500}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1">
                          <Avatar className="h-6 w-6">
                            <UserAvatar name={selectedUser.name} email={selectedUser.email}/>
                          </Avatar>
                          <span className="text-sm">{selectedUser.name}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{selectedUser.email}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {!selectedUser && (
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search for a user to create an avatar from..."
                    className="flex-1 bg-transparent border-none outline-none min-w-[100px] text-sm"
                  />
                )}
              </div>

              {searchResults.length > 0 && !selectedUser && (
                <div className="absolute w-full mb-1 border rounded-b-md bg-background shadow-lg z-50 -mt-[1px] overflow-hidden">
                  <ScrollArea className="max-h-[200px]">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 p-2 hover:bg-secondary cursor-pointer"
                        onClick={() => {
                          setSelectedUser(user)
                          setSearchValue('')
                          setSearchResults([])
                        }}
                      >
                        <Avatar className="h-7 w-7 rounded-md">
                          <UserAvatar name={user.name} email={user.email}/>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>

            <Button 
              onClick={handleSubmit}
              disabled={!selectedUser}
            >
              Start Chatting
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedUser && (
        <AvatarChat 
          avatarProfile={selectedUser}
          isOpen={isAvatarChatOpen}
          onOpenChange={handleAvatarChatOpenChange}
        />
      )}
    </>
  )
}
