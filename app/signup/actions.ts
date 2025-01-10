'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signup(name: string, email: string, password: string) {
  const supabase = await createClient()
  const data = { 
    email, 
    password,
    options: {
      data: {
        name,
      }
    }
  }
  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { message: error.message }
  }
}