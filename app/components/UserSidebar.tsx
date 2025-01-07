import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

type UserSidebarProps = {
  user: {
    id: string
    name: string
    email: string
    status: string
  } | null
  onClose: () => void
}

export function UserSidebar({ user, onClose }: UserSidebarProps) {
  if (!user) return null

  return (
    <div className="w-64 border-l h-full bg-card">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">User Profile</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-65px)]">
        <div className="p-4">
          <div className="flex flex-col items-center mb-4">
            <Avatar className="h-20 w-20 mb-2">
              <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${user.name}`} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-semibold">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-1">Status</h4>
            <p className="text-sm">{user.status || 'No status set'}</p>
          </div>
          {/* Add more user details here as needed */}
        </div>
      </ScrollArea>
    </div>
  )
}

