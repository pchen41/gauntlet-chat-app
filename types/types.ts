export type Channel = {
  id: string
  name: string
  description?: string
  type: string
  hiddenFromChannelList?: boolean
  joinedAt: string
  updatedAt: string
  createdBy?: string
}

export type Profile = {
  id: string
  name: string
  email: string
  status?: string
}

export type Message = {
  id: string
  user_id: string
  channel_id: string
  message: string
  created_at: string
  parent_id?: string
  message_attachments?: {
    file_url: string
    file_name: string
  }[]
  message_reactions?: {
    id: string
    user_id: string
    reaction: string
    created_at: string
  }[]
  replies?: string[] // message ids
}
