'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Globe,
  Settings,
  HelpCircle,
  Search,
  CreditCard,
  Shield,
  Activity,
  BookOpen,
  Map,
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
  SidebarRail,
} from '@/components/ui/sidebar';

const navMain = [
  {
    title: 'Dashboard',
    url: '/dashboard?tab=overview',
    icon: LayoutDashboard,
  },
  {
    title: 'Sites',
    url: '/dashboard?tab=sites',
    icon: Globe,
  },
  {
    title: 'Conflicts',
    url: '/dashboard?tab=conflicts',
    icon: Shield,
  },
  {
    title: 'Pages',
    url: '/dashboard?tab=pages',
    icon: FileText,
  },
  {
    title: 'Content Plan',
    url: '/dashboard?tab=content-plan',
    icon: BookOpen,
  },
  {
    title: 'Performance',
    url: '/dashboard?tab=performance',
    icon: Activity,
  },
  {
    title: 'Content Plan',
    url: '/dashboard?tab=content-plan',
    icon: Map,
  },
  {
    title: 'Approvals',
    url: '/dashboard?tab=approvals',
    icon: CheckSquare,
  },
  {
    title: 'Settings',
    url: '/dashboard?tab=settings',
    icon: Settings,
  },
];

const navSecondary = [
  {
    title: 'Subscription',
    url: '/dashboard/settings/subscription',
    icon: CreditCard,
  },
];

const data = {
  user: {
    name: '',
    email: '',
    avatar: '',
    subscriptionTier: '',
  },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');
  const [gapsCount, setGapsCount] = React.useState(0);

  const [userData, setUserData] = React.useState(data.user);
  React.useEffect(() => {
    const cachedName = localStorage.getItem('userName') || 'User';
    const cachedEmail = localStorage.getItem('userEmail') || '';
    const cachedTier = localStorage.getItem('subscriptionTier') || '';
    setUserData({ name: cachedName, email: cachedEmail, avatar: '', subscriptionTier: cachedTier });

    const token = localStorage.getItem('token');
    if (token) {
      // Load gaps count for Content Plan badge
      const selectedSiteRaw = localStorage.getItem('selectedSiteId');
      if (selectedSiteRaw) {
        fetch(`https://api.siloq.ai/api/v1/sites/${selectedSiteRaw}/content-gaps/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => res.ok ? res.json() : null)
          .then(d => {
            if (Array.isArray(d)) setGapsCount(d.length);
            else if (d?.results) setGapsCount(d.results.length);
          })
          .catch(() => {});
      }

      fetch('https://api.siloq.ai/api/v1/auth/me/', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.user) {
            const name = data.user.name ||
              [data.user.first_name, data.user.last_name].filter(Boolean).join(' ') ||
              data.user.email || cachedName;
            const email = data.user.email || cachedEmail;
            const subscriptionTier = data.user.subscription_tier || '';
            localStorage.setItem('userName', name);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('subscriptionTier', subscriptionTier);
            setUserData({ name, email, avatar: '', subscriptionTier });
          }
        })
        .catch(() => {});
    }
  }, []);

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
            {navMain.map((item) => {
              const tabParam = item.url.split('?tab=')[1];
              const isActive = currentTab === tabParam;
              const isContentPlan = tabParam === 'content-plan';
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link
                      href={item.url}
                      className="flex items-center gap-2 font-medium"
                    >
                      <item.icon className="size-4" />
                      {item.title}
                      {isContentPlan && gapsCount > 0 && (
                        <span className="ml-auto bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">
                          {gapsCount}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {navSecondary.map((item) => {
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
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
