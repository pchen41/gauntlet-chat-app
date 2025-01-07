'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/components/AuthProvider'
import Sidebar from '@/app/components/Sidebar'
import ChatArea from '@/app/components/ChatArea'

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
    <div className="flex h-screen">
      <Sidebar selectedChannelId={params.id} />
      <ChatArea channelId={params.id} />
    </div>
  )
}

