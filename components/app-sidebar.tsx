'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
  CreditCard,
} from 'lucide-react';

import { NavUser } from '@/components/nav-user';
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
} from '@/components/ui/sidebar';

// This is sample data.
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '',
  },
  navMain: [
    {
      title: 'Dashboard',
      url: '#',
      icon: LayoutDashboard,
      items: [
        {
          title: 'Overview',
          url: '/dashboard?tab=overview',
        },
        {
          title: 'Silos',
          url: '/dashboard?tab=silos',
        },
        {
          title: 'Approvals',
          url: '/dashboard?tab=approvals',
        },
      ],
    },
    {
      title: 'Content',
      url: '#',
      icon: FileText,
      items: [
        {
          title: 'Content Hub',
          url: '/dashboard?tab=content',
        },
        {
          title: 'Pages',
          url: '/dashboard?tab=pages',
        },
        {
          title: 'Internal Links',
          url: '/dashboard?tab=links',
        },
      ],
    },
    {
      title: 'Search Console',
      url: '#',
      icon: Search,
      items: [
        {
          title: 'Performance',
          url: '/dashboard?tab=search-console',
        },
      ],
    },
    {
      title: 'Sites',
      url: '#',
      icon: Globe,
      items: [
        {
          title: 'All Sites',
          url: '/dashboard?tab=sites',
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: 'Subscription',
      url: '/dashboard/settings/subscription',
      icon: CreditCard,
    },
    {
      title: 'Settings',
      url: '/dashboard/settings/api-keys',
      icon: Settings,
    },
    {
      title: 'Help Center',
      url: '/dashboard/help',
      icon: HelpCircle,
    },
    {
      title: 'Search',
      url: '#',
      icon: Search,
    },
  ],
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Dashboard: LayoutDashboard,
  Content: FileText,
  'Search Console': Search,
  Sites: Globe,
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div
                  className="flex aspect-square size-8 items-center justify-center overflow-hidden"
                  style={{ backgroundColor: 'transparent' }}
                >
                  <Image
                    src="/symbol.png"
                    alt="Siloq"
                    width={32}
                    height={32}
                    className="size-8 object-contain"
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Siloq</span>
                  <span className="text-xs">v1.0.0</span>
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
              const Icon = iconMap[item.title] || Database;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className="flex items-center gap-2 font-medium"
                    >
                      <Icon className="size-4" />
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((subItem) => {
                        const isActive =
                          currentTab === subItem.url.split('?tab=')[1];
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <Link href={subItem.url}>{subItem.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {data.navSecondary.map((item) => {
            const isTabUrl = item.url.includes('?tab=');
            const isActive = isTabUrl
              ? currentTab === item.url.split('?tab=')[1]
              : pathname === item.url || pathname.startsWith(item.url + '/');
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link
                    href={item.url}
                    className="flex items-center gap-2 font-medium"
                  >
                    <item.icon className="size-4" />
                    {item.title}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
