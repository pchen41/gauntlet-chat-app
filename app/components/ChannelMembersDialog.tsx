'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/utils/supabase-client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { User, UserPlus, X } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

type Member = {
  id: string
  name: string
  email: string
  isCreator: boolean
}

type ChannelMembersDialogProps = {
  channelId: string
  isOpen: boolean
  onClose: () => void
}

export function ChannelMembersDialog({ channelId, isOpen, onClose }: ChannelMembersDialogProps) {
  const { user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [channelCreatorId, setChannelCreatorId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchMembers()
      fetchChannelCreator()
    }
  }, [isOpen, channelId])

  async function fetchChannelCreator() {
    const { data, error } = await supabase
      .from('channels')
      .select('created_by')
      .eq('id', channelId)
      .single()

    if (error) {
      console.error('Error fetching channel creator:', error)
    } else if (data) {
      setChannelCreatorId(data.created_by)
    }
  }

  async function fetchMembers() {
    const { data, error } = await supabase
      .from('channel_members')
      .select(`
        user_id,
        profiles:user_id (
          id,
          name,
          email
        )
      `)
      .eq('channel_id', channelId)

    if (error) {
      console.error('Error fetching members:', error)
      toast({
        title: "Error",
        description: "Failed to fetch channel members",
        variant: "destructive",
      })
    } else if (data) {
      setMembers(data.map(item => ({
        ...item.profiles,
        isCreator: item.profiles.id === channelCreatorId
      } as Member)))
    }
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault()
    if (!newMemberEmail.trim() || isAddingMember) return

    setIsAddingMember(true)

    // First, find the user by email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', newMemberEmail.trim())
      .single()

    if (userError || !userData) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
      })
      setIsAddingMember(false)
      return
    }

    // Then, add the user to the channel
    const { error: addError } = await supabase
      .from('channel_members')
      .insert({ channel_id: channelId, user_id: userData.id })

    setIsAddingMember(false)

    if (addError) {
      if (addError.code === '23505') { // unique constraint violation
        toast({
          title: "Error",
          description: "User is already a member of this channel",
          variant: "destructive",
        })
      } else {
        console.error('Error adding member:', addError)
        toast({
          title: "Error",
          description: "Failed to add member to channel",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Success",
        description: "Member added successfully",
      })
      setNewMemberEmail('')
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Channel Members</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <form onSubmit={addMember} className="flex items-center space-x-2 mb-4">
            <Input
              type="email"
              placeholder="Add member by email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" disabled={isAddingMember}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </form>
          <ScrollArea className="h-[300px] pr-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${member.name}`} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">{member.name}</p>
                      {member.isCreator && (
                        <Badge variant="secondary" className="text-xs">
                          Creator
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                {member.id !== user?.id && !member.isCreator && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMember(member.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

