'use client'

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { ChevronDown, EyeClosed, EyeOff } from "lucide-react"
import Link from "next/link"
import { JSX } from "react"

export default function ChannelList({label, items, footerItem}: {label: string, items: {name: string, url: string, icon: React.ReactNode, selected?: boolean}[], footerItem?: JSX.Element}) {
  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel asChild className="group/label">
          <CollapsibleTrigger>            
            {label}
            <ChevronDown className={cn(
              "ml-auto transition-transform transition-opacity duration-200",
              "opacity-0 group-hover/label:opacity-100 group-data-[state=closed]/collapsible:opacity-100",
              "group-data-[state=open]/collapsible:rotate-180"
            )} />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton asChild className={cn('rounded-md', item.selected ? 'bg-gray-200 hover:bg-gray-200' : '')}>
                    <Link href={item.url}>
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
        <SidebarMenu>
          {footerItem}
        </SidebarMenu>
      </SidebarGroup>
    </Collapsible>
  )
}