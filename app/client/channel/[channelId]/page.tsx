import ChatContainer from "@/components/client/channel/chat-container";
import { createClient } from "@/lib/supabase/server";

export default async function Channel({params}: {params: {channelId: string}}) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    return null
  }

  const { data: channelData, error: channelError } = await supabase.from('channels').select('*').eq('id', (await params).channelId).single()
  if (channelError) {
    return null
  }

  const channel = {
    id: channelData.id,
    name: channelData.name,
    type: channelData.type,
    description: channelData.description,
    createdBy: channelData.created_by,
    joinedAt: '',
    updatedAt: ''
  }

  return (
    <ChatContainer user={data.user} channel={channel}/>
  )
}