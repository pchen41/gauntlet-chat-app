'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../components/AuthProvider'
import ChatArea from '../../../components/ChatArea'

export default function ChannelPage({ params }: { params: { id: string } }) {
  const { user, session } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!session) {
      router.push('/login')
    }
  }, [session, router])

  if (!user) return null

  return (
    <ChatArea channelId={params.id} />
  )
}

