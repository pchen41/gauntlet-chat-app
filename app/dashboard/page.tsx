'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../components/AuthProvider'
import Sidebar from '../components/Sidebar'

export default function Dashboard() {
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
      <Sidebar selectedChannelId={null} />
      <div className="flex-grow flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to pChat</h1>
          <p className="text-xl">Select a channel to start chatting</p>
        </div>
      </div>
    </div>
  )
}

