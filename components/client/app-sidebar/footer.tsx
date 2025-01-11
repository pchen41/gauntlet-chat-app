'use client'

import { Avatar } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, getInitials, stringToColor } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { ChevronsUpDown, LogOut, UserIcon } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import UserAvatar from "@/components/client/user-avatar/user-avatar"

export default function Footer({user}: {user: User}) {
  const { isMobile } = useSidebar()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{name: string, status: string} | null>(null)  
  const supabase = createClient()

  const getProfile = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`name, status`)
        .eq('id', user?.id)
        .single()

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setProfile(data)
      }
    } catch (error) {
      console.log('Error loading user data!')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    getProfile()
  }, [user, getProfile])

  var profileBlock = <>
    <div className="flex items-center space-x-4">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="grid flex-1 space-y-2">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-3 w-36" />
      </div>
    </div>
  </>

  if (!loading) {
    const name = profile?.name
    const status = profile?.status
    profileBlock = <>
      <Avatar className="h-8 w-8 rounded-lg">
        <UserAvatar name={name || user.email || ''} email={user.email} />
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold">{name || user.email}</span>
        <span className="truncate text-xs flex items-center gap-1">
          { status && status.toLowerCase() != 'online' ? status : <>
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            Online
          </>
          }
        </span>
      </div>
    </>
  }

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                {profileBlock}
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <UserIcon />
                  <Link href="/client/profile" className="w-full">
                    Profile
                  </Link>                
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut />
                <Link href="/logout" className="w-full">
                  Log out
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}