import { Header } from '@/components/home/header'
import { Button } from "@/components/ui/button"
import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center bg-gray-50 pb-[4.25rem]">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to pChat</h1>
          <p className="text-xl mb-8">A simple and efficient way to communicate with your team</p>
          <div className="space-x-4">
            <Button asChild size="lg">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
