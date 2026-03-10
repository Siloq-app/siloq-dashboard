'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import {
  Search,
  Rocket,
  LayoutDashboard,
  Network,
  Crown,
  Swords,
  Lightbulb,
  FileText,
  MessageCircleQuestion,
  BookOpen,
  ListChecks,
  Wrench,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { helpArticles, searchArticles } from '@/lib/help-content';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  LayoutDashboard,
  Network,
  Crown,
  Swords,
  Lightbulb,
  FileText,
  MessageCircleQuestion,
  BookOpen,
  ListChecks,
  Wrench,
};

function HelpCenterContent() {
  const [query, setQuery] = useState('');
  const filtered = searchArticles(query);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1 inline-flex h-7 w-7 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium text-slate-900 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 dark:text-slate-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb className="hidden md:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Help Center</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Help Center</h1>
          <p className="text-muted-foreground">
            Everything you need to get the most out of Siloq.
          </p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search help articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No articles match your search.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((article) => {
              const Icon = iconMap[article.icon] || FileText;
              return (
                <Link key={article.slug} href={`/dashboard/help/${article.slug}`}>
                  <Card className="h-full transition-colors hover:bg-accent/50 cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-base">{article.title}</CardTitle>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {article.description}
                      </CardDescription>
                      <div className="flex items-center gap-1 text-sm text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        Read article <ArrowRight className="h-3 w-3" />
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default function HelpPage() {
  return (
    <SidebarProvider>
      <Suspense fallback={null}>
        <AppSidebar />
      </Suspense>
      <SidebarInset>
        <Suspense fallback={<div className="flex h-16 items-center px-4">Loading...</div>}>
          <HelpCenterContent />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
