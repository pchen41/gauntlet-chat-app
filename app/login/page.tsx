import { Header } from '@/components/home/header'
import { LoginForm } from '@/components/home/login-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Login() {
  const supabase = await createClient()

  // getSession causes a redirect loop with '/client' for some reason
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/client')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-grow items-center justify-center bg-gray-50 pb-[4.25rem]">
        <LoginForm />
      </div>
    </div>
  )
}
