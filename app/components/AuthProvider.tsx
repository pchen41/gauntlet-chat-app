'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase-client'
import type { User, Session } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
  updateUserContext: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function getInitialSession() {
      setIsLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, status')
            .eq('id', session.user.id)
            .single()

          setSession(session)
          setUser({
            ...session.user,
            user_metadata: {
              ...session.user.user_metadata,
              ...profile
            }
          })
        } else {
          setSession(null)
          setUser(null)
        }
      } catch (error) {
        console.error('Error fetching initial session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setIsLoading(true)
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, status')
            .eq('id', session.user.id)
            .single()

          setSession(session)
          setUser({
            ...session.user,
            user_metadata: {
              ...session.user.user_metadata,
              ...profile
            }
          })
        } else {
          setSession(null)
          setUser(null)
        }
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const updateUserContext = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, status')
        .eq('id', user.id)
        .single()

      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          ...profile
        }
      })
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signOut,
    updateUserContext,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

