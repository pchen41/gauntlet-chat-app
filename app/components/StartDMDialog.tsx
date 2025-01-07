'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { supabase } from '@/utils/supabase-client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

type User = {
  id: string
  name: string
  email: string
}

type StartDMDialogProps = {
  isOpen: boolean
  onClose: () => void
  onDMCreated: () => void
}

export function StartDMDialog({ isOpen, onClose, onDMCreated }: StartDMDialogProps) {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen])

  async function fetchUsers() {
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .neq('id', user.id)

    if (error) {
      console.error('Error fetching users:', error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } else if (data) {
      setUsers(data)
    }
  }

  async function startDirectMessage() {
    if (selectedUsers.length === 0 || !user) return

    const userIds = [user.id, ...selectedUsers.map(u => u.id)]
    
    try {
      const { data, error } = await supabase
        .rpc('get_or_create_dm_channel', { 
          user_ids: userIds,
          current_user_id: user.id
        })

      if (error) throw error

      onDMCreated()
      onClose()
      router.push(`/client/channel/${data}`)
    } catch (error) {
      console.error('Error creating direct message:', error)
      toast({
        title: "Error",
        description: "Failed to start direct message. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start a Direct Message</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />
          <ScrollArea className="h-[300px] pr-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedUsers.some(u => u.id === user.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedUsers([...selectedUsers, user])
                      } else {
                        setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))
                      }
                    }}
                  />
                  <Avatar className="h-8 w-8 rounded-md">
                    <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${user.name}`} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={startDirectMessage} disabled={selectedUsers.length === 0}>
            Start Chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

