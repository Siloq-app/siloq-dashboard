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
  Users,
  Brain,
  Layers,
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
    url: '/dashboard?tab=dashboard',
    icon: LayoutDashboard,
    description: 'Overview & priorities',
  },
  {
    title: 'Sites',
    url: '/dashboard?tab=sites',
    icon: Globe,
    description: 'Manage your websites',
  },
  {
    title: 'SEO Plan',
    url: '/dashboard?tab=intelligence',
    icon: Brain,
    description: 'Prioritized action list',
  },
  {
    title: 'Conflicts',
    url: '/dashboard?tab=conflicts',
    icon: Shield,
    description: 'Keyword cannibalization',
  },
  {
    title: 'Pages',
    url: '/dashboard?tab=pages',
    icon: FileText,
    description: 'Page management',
  },
  {
    title: 'Content Depth',
    url: '/dashboard?tab=silo-health',
    icon: Layers,
    description: 'Find topic gaps',
  },
  {
    title: 'Content Plan',
    url: '/dashboard?tab=content-plan',
    icon: BookOpen,
    description: 'AI blog generation',
  },
  {
    title: 'Team & Authors',
    url: '/dashboard?tab=team-authors',
    icon: Users,
    description: 'E-E-A-T signals',
  },
  {
    title: 'Search Console',
    url: '/dashboard?tab=search-console',
    icon: Activity,
    description: 'GSC performance data',
  },
  {
    title: 'Approvals',
    url: '/dashboard?tab=approvals',
    icon: CheckSquare,
    description: 'Review pending changes',
  },
  {
    title: 'Settings',
    url: '/dashboard?tab=settings',
    icon: Settings,
    description: 'Site configuration',
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
              <Link href="/dashboard" className="flex items-center px-1 py-1">
                <Image
                  src="/logo-siloq.svg"
                  alt="Siloq"
                  width={100}
                  height={42}
                  className="object-contain"
                  priority
                />
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
                      <item.icon className="size-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{item.title}</span>
                          {isContentPlan && gapsCount > 0 && (
                            <span className="ml-auto bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full shrink-0">
                              {gapsCount}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <span className="text-[10px] text-muted-foreground leading-none truncate block">
                            {item.description}
                          </span>
                        )}
                      </div>
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
