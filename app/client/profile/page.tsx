'use client'

import { useCallback, useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Avatar } from "@/components/ui/avatar"
import UserAvatar from "@/components/client/user-avatar/user-avatar"
import { LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface Profile {
  id: string
  name: string
  email: string
  status: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const getProfile = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, status')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(data)
    } catch (error: any) {
      toast({
        title: 'Error loading profile',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('profiles')
        .update({
          status: profile.status
        })
        .eq('id', profile.id)

      if (error) throw error

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.'
      })
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    getProfile()
  }, [getProfile])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="space-y-6 p-10 pb-16 block h-full overflow-y-auto">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">
          Manage your profile information.
        </p>
      </div>
      <Separator />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32 rounded-lg">
              <UserAvatar 
                name={profile.name} 
                email={profile.email}
                textClass="text-5xl"
              />
            </Avatar>
            <div className="text-center">
              <h3 className="font-medium">{profile.name}</h3>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
        </aside>
        <div className="flex-1 lg:max-w-2xl">
          <form onSubmit={updateProfile} className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">General Information</h3>
              <p className="text-sm text-muted-foreground">
                Update your profile information and manage your account.
              </p>
            </div>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  value={profile.name}
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="status" className="text-sm font-medium">
                  Status
                </label>
                <Input
                  id="status"
                  value={profile.status || ''}
                  onChange={(e) => setProfile({ ...profile, status: e.target.value })}
                  placeholder="Set a status message..."
                />
                <p className="text-sm text-muted-foreground">
                  Your status will be visible to other users in the chat.
                </p>
              </div>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  Saving Changes
                  <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
