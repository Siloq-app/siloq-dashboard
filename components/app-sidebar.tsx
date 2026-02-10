'use client'

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import {
  LayoutDashboard,
  Database,
  CheckSquare,
  FileText,
  Link2,
  Globe,
  Settings,
  HelpCircle,
  Search,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import { useUser } from "@/lib/hooks/use-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// Navigation data (user is fetched dynamically)
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: LayoutDashboard,
      items: [
        {
          title: "Overview",
          url: "/dashboard?tab=overview",
          isActive: true,
        },
        {
          title: "Pages",
          url: "/dashboard?tab=pages",
        },
        {
          title: "Content Strategy",
          url: "/dashboard?tab=silos",
        },
        {
          title: "Approvals",
          url: "/dashboard?tab=approvals",
        },
      ],
    },
    {
      title: "Content",
      url: "#",
      icon: FileText,
      items: [
        {
          title: "Content Hub",
          url: "/dashboard?tab=content",
        },
        {
          title: "Internal Links",
          url: "/dashboard?tab=links",
        },
      ],
    },
    {
      title: "Sites",
      url: "#",
      icon: Globe,
      items: [
        {
          title: "All Sites",
          url: "/dashboard?tab=sites",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard?tab=settings",
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: HelpCircle,
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
  ],
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Dashboard: LayoutDashboard,
  Content: FileText,
  Sites: Globe,
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useUser()
  
  // Build user display data from real user
  const userData = {
    name: user 
      ? (user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.first_name || user.username || user.email.split('@')[0])
      : isLoading ? 'Loading...' : 'Guest',
    email: user?.email || '',
    avatar: '', // Could add avatar URL support later
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden" style={{ backgroundColor: 'transparent' }}>
                  <Image src="/symbol.png" alt="Siloq" width={32} height={32} className="size-8 object-contain" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Siloq</span>
                  <span className="text-xs">v1.1.0</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => {
              const Icon = iconMap[item.title] || Database
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className="font-medium flex items-center gap-2">
                      <Icon className="size-4" />
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={subItem.isActive}>
                            <Link href={subItem.url}>{subItem.title}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {data.navSecondary.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link href={item.url} className="font-medium flex items-center gap-2">
                  <item.icon className="size-4" />
                  {item.title}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
