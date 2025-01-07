'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../components/AuthProvider'
import { supabase } from '@/utils/supabase-client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import Sidebar from '../components/Sidebar'
import { LogOut } from 'lucide-react'

export default function Profile() {
  const { user, updateUserContext, signOut } = useAuth()
  const [name, setName] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('name, status')
            .eq('id', user.id)
            .single()

          if (error) throw error

          setName(data.name || '')
          setStatus(data.status || '')
        } catch (error) {
          console.error('Error fetching profile:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchProfile()
  }, [user])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Update public.profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name, status })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Trigger real-time update
      await supabase.from('profiles').update({ updated_at: new Date().toISOString() }).eq('id', user.id)

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="flex h-screen">
      <Sidebar selectedChannelId={null} />
      <div className="flex-grow flex items-center justify-center bg-gray-100">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdateProfile}>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <Input 
                    id="status" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
              <Button className="w-full" variant="outline" onClick={handleLogout} disabled={loading}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

