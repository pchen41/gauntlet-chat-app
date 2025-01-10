'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { User } from '@supabase/supabase-js'
import UserAvatar from '../user-avatar/user-avatar'
import { Channel } from '@/types/types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type Member = {
  id: string
  name: string
  email: string
  creator: boolean
}

type ChannelMembersDialogProps = {
  user: User
  channel: Channel
  isOpen: boolean
  onClose: () => void
}

export default function ChannelMembersDialog({user, channel, isOpen, onClose }: ChannelMembersDialogProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()
  const channelId = channel.id
  const channelCreatorId = channel.createdBy || ''
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; email: string }[]>([])
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const [isSelectingUser, setIsSelectingUser] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchMembers()
    } else {
      setNewMemberEmail('')
      setSearchResults([])
    }
  }, [isOpen, channelId])

  async function fetchMembers() {
    const { data: membersData, error: membersError } = await supabase
      .from('channel_members')
      .select(`
        profiles:user_id (
          id,
          name,
          email
        )
      `)
      .eq('channel_id', channelId)

    if (membersError) {
      toast({
        title: "Failed to fetch channel members",
        description: membersError.message,
        variant: "destructive",
      })
    } else if (membersData) {
      setMembers(membersData.map(member => ({
        id: (member.profiles as any).id,
        name: (member.profiles as any).name,
        email: (member.profiles as any).email,
        creator: (member.profiles as any).id === channelCreatorId,
      })))
    }
  }

  async function performSearch(search: string) {
    if (search.length < 2) {
      setSearchResults([])
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, name, email')
      .neq('id', user.id)
      .or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      .limit(10)
    
    const filteredResults = (data || []).filter(profile => 
      !members.some(member => member.id === profile.id)
    )
    setSearchResults(filteredResults)
  }

  // debounce search to prevent excessive requests
  function handleSearch(search: string) {
    setNewMemberEmail(search)
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    searchTimeout.current = setTimeout(() => {
      performSearch(search)
    }, 300)
  }

  async function addMember(userId: string, email: string) {
    setIsAddingMember(true)

    const { error: addError } = await supabase
      .from('channel_members')
      .insert({ channel_id: channelId, user_id: userId })

    setIsAddingMember(false)

    if (addError) {
      if (addError.code === '23505') { // unique constraint violation
        toast({
          title: "Error",
          description: "User is already a member of this channel",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Failed to add member to channel",
          description: addError.message,
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Success",
        description: "Member added successfully",
      })
      setNewMemberEmail('')
      setSearchResults([])
      fetchMembers()
    }
  }

  async function removeMember(memberId: string) {
    if (memberId === channelCreatorId) {
      toast({
        title: "Error",
        description: "Cannot remove the channel creator",
        variant: "destructive",
      })
      return
    }

    const { error } = await supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', memberId)

    if (error) {
      console.error('Error removing member:', error)
      toast({
        title: "Error",
        description: "Failed to remove member from channel",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Member removed successfully",
      })
      fetchMembers()
    }
  }

  const showSuggestions = searchResults.length > 0
  const borderRounding = showSuggestions ? 'rounded-t-md' : 'rounded-md'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Channel Members</DialogTitle>
        </DialogHeader>
        <div className={channel.type === 'direct' ? "" : "mt-2"}>
          {channel.type !== 'direct' && (
            <div className="relative mb-4">
              <div className={`flex items-center space-x-2 border border-input ${borderRounding}`}>
                <Input
                  type="text"
                  placeholder="Add user..."
                  value={newMemberEmail}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => {
                    setTimeout(() => {
                      if (!isSelectingUser) {
                        setIsInputFocused(false)
                      }
                    }, 200)
                  }}
                  className={"border-0 flex-grow text-sm outline-none" + (showSuggestions ? 'rounded-b-none focus-visible:ring-0' : '')}
                />
              </div>

              {showSuggestions && (
                <div className="absolute w-full border border-input overflow-hidden rounded-b-md bg-background shadow-lg z-50 -mt-[1px]">
                  <div className="px-2 pt-2 text-xs text-muted-foreground">
                    Select to add
                  </div>
                  <ScrollArea className="max-h-[200px]">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center gap-2 p-2 hover:bg-secondary cursor-pointer"
                        onMouseDown={() => {
                          setIsSelectingUser(true)
                          addMember(result.id, result.email)
                          setIsSelectingUser(false)
                        }}
                      >
                        <Avatar className="h-7 w-7 rounded-md">
                          <UserAvatar name={result.name} email={result.email} />
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm">{result.name}</span>
                          <span className="text-xs text-muted-foreground">{result.email}</span>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
          <ScrollArea>
            {members.map((member, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <UserAvatar name={member.name} email={member.email} />
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">{member.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                { member.id !== user?.id && user?.id === channelCreatorId && channel.type !== 'direct' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMember(member.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {member.creator && channel.type !== 'direct' && (
                  <Badge variant="secondary">
                    Creator
                  </Badge>
                )}
              </div>
            ))}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
