'use client'

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

export function SearchHeader() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [initialQuery, setInitialQuery] = useState("")

  useEffect(() => {
    const query = searchParams.get('q')
    if (query) {
      setSearchQuery(query)
      setInitialQuery(query)
    }
  }, [searchParams])

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      if (initialQuery == searchQuery) {
        router.refresh()
      } else {
        router.push(`/client/search?q=${encodeURIComponent(searchQuery)}`)
      }
    }
  }

  return (
    <header className="h-14 bg-sidebar flex items-center">
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          type="search"
          placeholder="Search messages..."
          className="w-full pl-9 bg-background"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
      </div>
    </header>
  )
}
