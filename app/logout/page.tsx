import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function Logout() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    alert(error.message)
  }

  return redirect('/')
}