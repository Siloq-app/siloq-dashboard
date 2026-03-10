'use client';

import { use, Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { helpArticles, getArticleBySlug } from '@/lib/help-content';

function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let tableRows: string[][] = [];
  let inTable = false;

  const parseInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)|`(.+?)`)/g;
    let lastIdx = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.slice(lastIdx, match.index));
      }
      if (match[2]) {
        parts.push(<strong key={key++}>{match[2]}</strong>);
      } else if (match[3] && match[4]) {
        const href = match[4].startsWith('./') ? `/dashboard/help/${match[4].replace('./', '').replace('.md', '')}` : match[4];
        parts.push(
          <Link key={key++} href={href} className="text-primary underline underline-offset-4 hover:text-primary/80">
            {match[3]}
          </Link>
        );
      } else if (match[5]) {
        parts.push(
          <code key={key++} className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
            {match[5]}
          </code>
        );
      }
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < text.length) parts.push(text.slice(lastIdx));
    return parts;
  };

  const flushTable = () => {
    if (tableRows.length < 2) return;
    const headers = tableRows[0];
    const dataRows = tableRows.slice(1).filter(r => !r.every(c => /^[-:]+$/.test(c.trim())));
    elements.push(
      <div key={`table-${i}`} className="my-4 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b">
              {headers.map((h, hi) => (
                <th key={hi} className="text-left p-2 font-semibold">{parseInline(h.trim())}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => (
              <tr key={ri} className="border-b last:border-0">
                {row.map((cell, ci) => (
                  <td key={ci} className="p-2">{parseInline(cell.trim())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  };

  while (i < lines.length) {
    const line = lines[i];

    // Table detection
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      inTable = true;
      const cells = line.trim().slice(1, -1).split('|');
      tableRows.push(cells);
      i++;
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-semibold mt-8 mb-3">{parseInline(line.slice(3))}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-lg font-semibold mt-6 mb-2">{parseInline(line.slice(4))}</h3>);
    } else if (line.startsWith('---')) {
      elements.push(<Separator key={i} className="my-6" />);
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-4 border-primary/30 pl-4 py-1 my-3 text-muted-foreground italic">
          {parseInline(line.slice(2))}
        </blockquote>
      );
    } else if (/^\d+\.\s/.test(line.trim())) {
      const items: string[] = [line.trim().replace(/^\d+\.\s/, '')];
      while (i + 1 < lines.length && /^\d+\.\s/.test(lines[i + 1].trim())) {
        i++;
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
      }
      elements.push(
        <ol key={i} className="list-decimal list-inside space-y-1 my-3 ml-2">
          {items.map((item, idx) => <li key={idx}>{parseInline(item)}</li>)}
        </ol>
      );
    } else if (line.trim().startsWith('- ')) {
      const items: string[] = [line.trim().slice(2)];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('- ')) {
        i++;
        items.push(lines[i].trim().slice(2));
      }
      elements.push(
        <ul key={i} className="list-disc list-inside space-y-1 my-3 ml-2">
          {items.map((item, idx) => <li key={idx}>{parseInline(item)}</li>)}
        </ul>
      );
    } else if (line.trim() === '') {
      // skip
    } else {
      elements.push(<p key={i} className="my-2 leading-7">{parseInline(line)}</p>);
    }
    i++;
  }
  if (inTable) flushTable();

  return <div className="prose-sm">{elements}</div>;
}

function ArticleContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const idx = helpArticles.findIndex((a) => a.slug === slug);
  const prev = idx > 0 ? helpArticles[idx - 1] : null;
  const next = idx < helpArticles.length - 1 ? helpArticles[idx + 1] : null;

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
              <BreadcrumbLink href="/dashboard/help">Help Center</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{article.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <Link href="/dashboard/help">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Help Center
          </Button>
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-6">{article.title}</h1>

        <SimpleMarkdown content={article.content} />

        <Separator className="my-8" />

        <div className="flex items-center justify-between">
          {prev ? (
            <Link href={`/dashboard/help/${prev.slug}`}>
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                {prev.title}
              </Button>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link href={`/dashboard/help/${next.slug}`}>
              <Button variant="outline" size="sm">
                {next.title}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </>
  );
}

export default function HelpArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <SidebarProvider>
      <Suspense fallback={null}>
        <AppSidebar />
      </Suspense>
      <SidebarInset>
        <Suspense fallback={<div className="flex h-16 items-center px-4">Loading...</div>}>
          <ArticleContent params={params} />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
