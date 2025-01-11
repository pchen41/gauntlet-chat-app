import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/client/app-sidebar/app-sidebar'
import { SearchHeader } from '@/components/client/search/search-header'
import { PresenceProvider } from '@/contexts/presence-context'

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  const { data: channels, error: channelsError, status: channelsStatus } = await supabase
    .from('channel_members')
    .select(`
      hidden_from_channel_list,
      created_at,
      updated_at,
      channels (
        id,
        name,
        description,
        type
      )
    `)
    .eq('user_id', data.user.id)
    .is('hidden_from_channel_list', false)

  if (channelsError && channelsStatus !== 406) {
    throw channelsError
  }

  // Get all members for direct message channels
  // @ts-ignore
  const directChannels = channels?.filter(c => c.channels.type === 'direct').map(c => c.channels.id) || []
  const { data: channelMembers } = await supabase
    .from('channel_members')
    .select(`
      channel_id,
      profiles:user_id (
        name
      )
    `)
    .in('channel_id', directChannels)
    .neq('user_id', data.user.id)

  // Create a map of channel IDs to member names
  const membersByChannel = channelMembers?.reduce((acc, member) => {
    if (!acc[member.channel_id]) {
      acc[member.channel_id] = []
    }
    // @ts-ignore
    acc[member.channel_id].push(member.profiles.name)
    return acc
  }, {} as Record<string, string[]>) || {}

  const initialChannels = channels?.map((channel: any) => ({
    id: channel.channels.id,
    name: channel.channels.type === 'direct' 
      ? membersByChannel[channel.channels.id]?.join(', ') || "Direct message"
      : channel.channels.name,
    description: channel.channels.description,
    type: channel.channels.type,
    hiddenFromChannelList: channel.hidden_from_channel_list,
    joinedAt: channel.created_at,
    updatedAt: channel.updated_at
  })) || []

  return (
    <PresenceProvider user={data.user}>
      <SidebarProvider>
        <AppSidebar user={data.user} initialChannels={initialChannels} />
        <SidebarInset className="bg-sidebar flex flex-col h-screen">
          <SearchHeader />
          <div className="flex-1 rounded-tl-md overflow-hidden bg-background border">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </PresenceProvider>
  )
}
