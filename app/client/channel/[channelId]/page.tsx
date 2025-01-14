import ChatContainer from "@/components/client/channel/chat-container";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Channel({params}: {params: {channelId: string}}) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    return null
  }

  const { data: channelData, error: channelError } = await supabase.from('channels').select('*').eq('id', (await params).channelId).single()
  if (channelError) {
    redirect('/client/channels')
  }

  // Check if user is a member of the channel
  const { data: memberData, error: memberError } = await supabase
    .from('channel_members')
    .select('*')
    .eq('channel_id', channelData.id)
    .eq('user_id', data.user.id)
    .single()

  const isMember = !!memberData

  // Only redirect if it's not a public channel and user is not a member
  if ((memberError || !memberData) && channelData.type !== 'public') {
    redirect('/client/channels')
  }

  const channel = {
    id: channelData.id,
    name: channelData.name,
    type: channelData.type,
    description: channelData.description,
    createdBy: channelData.created_by,
    joinedAt: memberData?.created_at,
    updatedAt: memberData?.updated_at
  }

  return (
    <ChatContainer user={data.user} channel={channel} isMember={isMember} />
  )
}