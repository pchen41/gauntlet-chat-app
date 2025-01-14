import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { LayoutGrid } from "lucide-react"
import Link from "next/link"

export default async function Client() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', data.user.id)
    .single()

  return (
    <div className="h-screen flex flex-col items-center justify-center space-y-8 p-4 pt-0 pb-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to pChat{profile?.name ? `, ${profile.name}` : ''}
        </h1>
        <p className="text-muted-foreground">
          Start chatting with your team in real-time
        </p>
      </div>

      <Link href="/client/channels">
        <Button size="lg" className="space-x-2">
          <LayoutGrid className="h-5 w-5" />
          <span>Browse Channels</span>
        </Button>
      </Link>
    </div>
  )
}