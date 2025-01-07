'use client'

import { useState } from 'react'
import { AppSidebar } from '../components/Sidebar'
import { SidebarProvider } from "@/components/ui/sidebar"
import { useAuth } from '../components/AuthProvider'
import { Loader2 } from 'lucide-react'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <div className="flex h-screen items-center justify-center">Please log in to access this page.</div>
  }

  return (
    <div className="flex h-screen">
      <SidebarProvider defaultOpen={true}>
        <AppSidebar selectedChannelId={null} refreshTrigger={refreshTrigger} />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </SidebarProvider>
    </div>
  )
}

