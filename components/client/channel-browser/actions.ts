'use server'

import { createClient } from "@/lib/supabase/server"

export async function joinChannel(channelId: string) {
  const supabase = await createClient()

  const { data: user, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { message: userError?.message }
  }

  const { error } = await supabase
    .from('channel_members')
    .insert([{ channel_id: channelId, user_id: user.user.id }])
    
  if (error) {
    return { message: error.message }
  }  
}

export async function createChannel(
  name: string,
  description: string,
  type: string,
) {
  const supabase = await createClient()

  const { data: user, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { message: userError?.message }
  }

  const { data, error } = await supabase
    .rpc('create_channel', {
      channel_name: name,
      channel_description: description, 
      channel_type: type,
      user_id: user.user.id
    })

  if (error) {
    return { message: error.message }
  }

  return { channelId: data }
}

