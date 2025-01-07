'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../components/AuthProvider'
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'

export default function Dashboard() {
  const { user, session, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/login')
    }
  }, [isLoading, session, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex-1 p-8 pt-6">
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <h1 className="text-3xl font-bold mb-6">Welcome to pChat, {user.user_metadata?.name || 'User'}!</h1>
          <p className="text-xl mb-4">Start chatting or join a channel to connect with your team.</p>
          <p className="text-muted-foreground">
            Use the sidebar to navigate between channels and start direct messages. 
            If you need any help, don't hesitate to reach out to our support team.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

