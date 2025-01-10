'use client'

import { Button } from "@/components/ui/button"
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { JSX } from "react"

export default function ChannelList({label, labelButton, items, footerItem}: {label: string, labelButton?: {icon: React.ReactNode, onClick: () => void}, items: {name: string, url: string, icon: React.ReactNode, selected?: boolean}[], footerItem?: JSX.Element}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <div className="flex items-center justify-between w-full group">
          {label}
          {labelButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" 
              onClick={labelButton.onClick}
            >
              {labelButton.icon}
            </Button>
          )}
        </div>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item, index) => (
            <SidebarMenuItem key={index}>
              <SidebarMenuButton asChild className={cn('rounded-md', item.selected ? 'bg-gray-100 hover:bg-gray-100' : '')}>
                <Link href={item.url}>
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {footerItem}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}