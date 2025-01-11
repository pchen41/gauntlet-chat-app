'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User } from "@supabase/supabase-js"
import { useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, X } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import UserAvatar from "../user-avatar/user-avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { usePresenceState } from "@/contexts/presence-context"

interface Profile {
  id: string
  name: string
  email: string
}

export function CreateDMModal({
  isOpen,
  onClose,
  currentUser
}: {
  isOpen: boolean
  onClose: () => void
  currentUser: User
}) {
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([])
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const {toast} = useToast()
  const router = useRouter()
  const supabase = createClient()
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

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
    
    // Filter out already selected users
    const filteredResults = (data || []).filter(user => 
      !selectedUsers.some(selectedUser => selectedUser.id === user.id)
    )
    setSearchResults(filteredResults)
  }

  // debounce search so that it doesn't trigger too often
  function handleSearch(search: string) {
    setSearchValue(search)
    
    // Clear existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    // Set new timeout
    searchTimeout.current = setTimeout(() => {
      performSearch(search)
    }, 300)
  }

  async function createDirectMessage() {
    if (selectedUsers.length === 0) return
    
    setIsCreating(true)
    const { data: channel, error } = await supabase
      .rpc('create_direct_channel', {
        current_user_id: currentUser.id,
        participant_user_ids: selectedUsers.map(u => u.id),
        channel_title: selectedUsers.map(u => u.name).join(', ')
      })

    if (error) {
      toast({
        title: "Error creating DM",
        description: error.message,
        variant: "destructive",
      })
      setIsCreating(false)
      return
    }

    onClose()
    setSelectedUsers([])
    setIsCreating(false)
    router.push(`/client/channel/${channel}`)
  }

  function handleClose() {
    setSearchResults([])
    setSearchValue('')
    setSelectedUsers([])
    onClose()
  }

  const borderRounding = searchResults.length > 0 ? 'rounded-t-md' : 'rounded-md'
  const onlineUsers = usePresenceState()

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Direct Message</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4">
          <div className="relative">
            <div className={"flex flex-wrap gap-2 min-h-[40px] p-2 border items-center " + borderRounding}>
              {selectedUsers.map((user) => (
                <TooltipProvider key={user.id}>
                  <Tooltip delayDuration={500}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 bg-secondary rounded-full px-3 py-1">
                        <span className="text-sm">{user.name}</span>
                        <button
                          onClick={() => setSelectedUsers(users => users.filter(u => u.id !== user.id))}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{user.email}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search users..."
                className="flex-1 bg-transparent border-none outline-none min-w-[100px] text-sm"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="absolute w-full mb-1 border rounded-b-md bg-background shadow-lg z-50 -mt-[1px] overflow-hidden">
                <ScrollArea className="max-h-[200px]">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 p-2 hover:bg-secondary cursor-pointer"
                      onClick={() => {
                        if (!selectedUsers.find(u => u.id === user.id)) {
                          setSelectedUsers([...selectedUsers, user])
                        }
                        setSearchValue('')
                        setSearchResults([])
                      }}
                    >
                      <Avatar className="h-7 w-7 rounded-md">
                        <UserAvatar name={user.name} email={user.email}/>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{user.name}</span>
                          <span className={`h-1.5 w-1.5 rounded-full ${onlineUsers[user.id] ? 'bg-green-500' : 'bg-gray-400'}`} />
                        </div>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
          </div>

          <Button 
            onClick={createDirectMessage}
            disabled={selectedUsers.length === 0 || isCreating}
          >
            Start Conversation
            {isCreating && <Loader2 className="h-4 w-4 animate-spin" /> }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}