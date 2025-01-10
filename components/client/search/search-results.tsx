'use client'

import { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useInView } from "react-intersection-observer"
import { Message, Profile } from "@/types/types"
import ChatMessage from "../channel/chat-message"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const PAGE_SIZE = 20

export default function SearchResults({
  initialQuery,
  user
}: {
  initialQuery: string,
  user: User
}) {
  const [messages, setMessages] = useState<any[]>([])
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const { ref, inView } = useInView()
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  const parseQuery = (query: string) => {
    const emailMatch = query.match(/@email:([^\s]+)/)
    if (emailMatch) {
      return {
        searchText: query.replace(/@email:[^\s]+/, '').trim(),
        email: emailMatch[1]
      }
    }
    return { searchText: query, email: null }
  }

  const fetchResults = async (isInitial = false) => {
    try {
      const { searchText, email } = parseQuery(initialQuery)
      
      let query = supabase
        .from('messages')
        .select(`
          *,
          message_attachments(file_url, file_name),
          message_reactions(id, user_id, reaction, created_at),
          channels!inner(id, type, name)
        `)
        .textSearch('message', searchText)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        .order('created_at', { ascending: false })

      /*
      // Filter for accessible channels
      query = query.or(`channels.type.eq.public,channels.id.in.${
        supabase.from('channel_members')
          .select('channel_id')
          .eq('user_id', user.id)
      }`)

      if (email) {
        query = query.or(`user_id.in.${
          supabase.from('profiles')
            .select('id')
            .eq('email', email)
        }`)
      }*/

      const { data, error } = await query

      if (error) throw error

      if (data) {
        // Fetch profiles for messages
        const userIds = [...new Set(data.map(m => m.user_id))]
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds)

        if (profilesData) {
          setProfiles(new Map(profilesData.map(p => [p.id, p])))
        }

        setMessages(prev => isInitial ? data : [...prev, ...data])
        setHasMore(data.length === PAGE_SIZE)
      }
    } catch (error: any) {
      toast({
        title: "Error fetching results",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setMessages([])
    setPage(0)
    setHasMore(true)
    setIsLoading(true)
    fetchResults(true)
  }, [initialQuery])

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      setPage(p => p + 1)
      fetchResults()
    }
  }, [inView])

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Search Results</h1>
        <p className="text-sm text-muted-foreground">
          Showing results for "{initialQuery}"
        </p>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No messages found matching your search.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {messages.map((message) => (
              <div key={message.id} className="py-4 first:pt-0 last:pb-0">
                <ChatMessage
                  message={message}
                  user={user}
                  profiles={profiles}
                  onAddReaction={() => {}}
                  onRemoveReaction={() => {}}
                  disabled={true}
                  channelName={<Link href={`/client/channel/${message.channels?.id}`} className="text-muted-foreground hover:underline">{message.channels?.type === "direct" ? 'Direct message' : '#'+message.channels?.name}</Link>}
                />
              </div>
            ))}
            {hasMore && (
              <div ref={ref} className="py-4 text-center text-muted-foreground">
                Loading more results...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
