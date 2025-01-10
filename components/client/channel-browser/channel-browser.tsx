'use client'

import { DataTable } from "@/components/data-table/data-table"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { LoaderCircle, Lock, Plus } from "lucide-react"
import Link from "next/link"
import { JSX, useCallback, useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { joinChannel } from "./actions"
import CreateChannelButton from "./create-channel-button"
import { useRouter } from "next/navigation"

type Channel = {
  id: string
  name: string
  description?: string
  type: string
  member: boolean
}

function JoinButton({user, channel, toast}: {user: User, channel: Channel, toast: any}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    try {
      setLoading(true)
      const error = await joinChannel(channel.id)
      if (error) {
        throw error
      }
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Unable to join channel',
        description: error.message,
        variant: 'destructive'
      })
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleJoin}
      disabled={loading}
    >
      Join
      {loading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : null}
    </Button>
  )
}

function ViewButton({channel}: {channel: Channel}) {
  return (
    <Button variant="outline" size="sm">
      <Link href={`/client/channel/${channel.id}`}>
          View
      </Link>
    </Button>
  )

}

export default function ChannelBrowser({user}: {user: User}) {
  const { toast } = useToast()
  const [viewableChannels, setViewableChannels] = useState<{id: string, name: string, description: string, type: string}[]>([])
  const [joinedChannels, setJoinedChannels] = useState<Set<string>>(new Set())
  const [emptyMessage, setEmptyMessage] = useState<JSX.Element | undefined>(undefined)
  const supabase = createClient()

  const getChannels = useCallback(async () => {
    try {
      setEmptyMessage(<div className="flex items-center justify-center"><LoaderCircle className="animate-spin" /></div>)
      
      const { data: channels, error: channelsError, status: channelStatus } = await supabase
        .from('channels')
        .select('*')
        .not('type', 'eq', 'direct')
        .or('type.eq.public,created_by.eq.' + user.id)

      const { data: memberships, error: membershipsError, status: membershipStatus } = await supabase
        .from('channel_members')
        .select('channel_id')
        .eq('user_id', user.id)
      const error = (channelStatus !== 406 && channelsError) || (membershipStatus !== 406 && membershipsError)

      if (error) {
        toast({
          title: 'Unable to load channels',
          description: channelsError?.message || membershipsError?.message,
          variant: 'destructive'
        })
        throw error
      }

      if (memberships) {
        setJoinedChannels(new Set(memberships.map(mc => mc.channel_id)))
      }
      if (channels) {
        setViewableChannels(channels)
      }
      setEmptyMessage(undefined)
    } catch (error) {
      setEmptyMessage(<>Error loading channels, please try again.</>)
    }
  }, [user, supabase])

  useEffect(() => {
    getChannels()
  }, [user, getChannels])

  const schema = [
    {
      key: 'name',
      label: 'Channel',
      filterLabel: 'Filter channels...',
      renderFn: (channel: Channel) => {
        const isPrivate = channel.type === 'private'
        return (
          <div>
            <div>
              <span className="font-semibold">{channel.name + (isPrivate ? ' ' : '')}</span>
              {isPrivate && (
                <Tooltip>
                  <TooltipTrigger>
                    <Lock className="h-2.5 w-2.5"/>
                  </TooltipTrigger>
                  <TooltipContent>Private</TooltipContent>
                </Tooltip>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{channel.description}</span>
          </div>
        )
      }
    },
    {
      key: 'joined',
      renderFn: (channel: Channel) => {
        return channel.member ? <ViewButton channel={channel} /> : <JoinButton user={user} channel={channel} toast={toast} />
      },
      className: 'w-16'
    }
  ]

  const channels = viewableChannels.map(channel => ({
    ...channel,
    member: joinedChannels.has(channel.id)
  }))

  const toolbar = () => (<CreateChannelButton />)

  return (
    <DataTable schema={schema} data={channels} emptyMessage={emptyMessage} toolbar={toolbar} />
  )
}
