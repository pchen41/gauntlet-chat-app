import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SearchResults from "@/components/client/search/search-results"

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q: string }
}) {
  const supabase = await createClient()
  const { data: user, error } = await supabase.auth.getUser()
  
  if (error || !user?.user) {
    redirect('/login')
  }

  const query = (await searchParams).q
  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <h1 className="text-2xl font-bold mb-2">Search Messages</h1>
        <p className="text-muted-foreground text-center max-w-[500px]">
          Enter a search term in the search bar above to find messages across your channels.
          Use @email:email to filter by sender.
        </p>
      </div>
    )
  }

  return <div className="h-full">
    <SearchResults initialQuery={query} user={user.user} />
  </div>
}
