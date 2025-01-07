'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../components/AuthProvider'
import { supabase } from '@/utils/supabase-client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Hash, Lock, Search, PlusCircle } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"
import Sidebar from '../components/Sidebar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type Channel = {
  id: string
  name: string
  type: 'public' | 'private'
  is_member: boolean
}

export default function BrowseChannels() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public')
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchChannels()
    }
  }, [user])

  async function fetchChannels() {
    if (!user) return

    // Fetch all channels
    const { data: allChannels, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .or('type.eq.public,created_by.eq.' + user.id)

    if (channelError) {
      console.error('Error fetching channels:', channelError)
      return
    }

    // Fetch user's channel memberships
    const { data: memberChannels, error: memberError } = await supabase
      .from('channel_members')
      .select('channel_id')
      .eq('user_id', user.id)

    if (memberError) {
      console.error('Error fetching member channels:', memberError)
      return
    }

    const memberChannelIds = new Set(memberChannels.map(mc => mc.channel_id))

    // Combine and process the channels
    const processedChannels = allChannels.map(channel => ({
      ...channel,
      is_member: memberChannelIds.has(channel.id)
    }))

    setChannels(processedChannels)
  }

  async function joinChannel(channelId: string) {
    if (!user) return;

    const { error } = await supabase
      .from('channel_members')
      .insert({ channel_id: channelId, user_id: user.id })

    if (error) {
      console.error('Error joining channel:', error)
      toast({
        title: "Error",
        description: "Failed to join channel",
        variant: "destructive",
      })
    } else {
      setChannels(channels.map(channel => 
        channel.id === channelId ? { ...channel, is_member: true } : channel
      ))
      setRefreshTrigger(prev => prev + 1)
      toast({
        title: "Success",
        description: "Joined channel successfully",
      })
    }
  }

  async function createChannel() {
    if (!user) {
      console.error('User not authenticated');
      return;
    }
    if (!newChannelName.trim()) {
      toast({
        title: "Error",
        description: "Channel name cannot be empty",
        variant: "destructive",
      })
      return;
    }
    const { data, error } = await supabase
      .from('channels')
      .insert([{ 
        name: newChannelName.trim(), 
        type: newChannelType, 
        created_by: user.id 
      }])
      .select()
    if (error) {
      console.error('Error creating channel:', error);
      toast({
        title: "Error",
        description: "Failed to create channel",
        variant: "destructive",
      })
    } else if (data) {
      setChannels(prevChannels => [...prevChannels, { ...data[0], is_member: true }]);
      setNewChannelName('');
      setIsCreateChannelOpen(false);
      setRefreshTrigger(prev => prev + 1);
      toast({
        title: "Success",
        description: "Channel created successfully",
      })
    }
  }

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-screen">
      <Sidebar selectedChannelId={null} refreshTrigger={refreshTrigger} />
      <div className="flex-grow p-6 bg-gray-100">
        <h1 className="text-2xl font-bold mb-4">Browse Channels</h1>
        <div className="mb-4 flex justify-between items-center">
          <div className="relative flex-grow mr-4">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search channels"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="bg-blue-600 text-white hover:bg-blue-700">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Channel
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>Create a new channel</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Type</Label>
                  <RadioGroup
                    value={newChannelType}
                    onValueChange={(value: 'public' | 'private') => setNewChannelType(value)}
                    className="col-span-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="public" />
                      <Label htmlFor="public">Public</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="private" />
                      <Label htmlFor="private">Private</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              <Button onClick={createChannel} className="bg-blue-600 text-white hover:bg-blue-700">Create Channel</Button>
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="h-[calc(100vh-200px)]">
          {filteredChannels.map(channel => (
            <div key={channel.id} className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center">
                {channel.type === 'public' ? <Hash className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                <span>{channel.name}</span>
              </div>
              {channel.is_member ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/channel/${channel.id}`)}
                >
                  View
                </Button>
              ) : (
                <Button
                  onClick={() => joinChannel(channel.id)}
                  variant="outline"
                  size="sm"
                >
                  Join
                </Button>
              )}
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  )
}

