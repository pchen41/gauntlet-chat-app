import Link from 'next/link'
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="flex items-center justify-between p-4 bg-white border-b">
      <Link href="/" className="text-2xl font-bold text-primary">pChat</Link>
      <nav>
        <Button asChild variant="ghost">
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild variant="default">
          <Link href="/signup">Sign Up</Link>
        </Button>
      </nav>
    </header>
  )
}
