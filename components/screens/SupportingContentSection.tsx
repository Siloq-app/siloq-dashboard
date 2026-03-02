'use client';

/**
 * SupportingContentSection
 *
 * Renders inside the page analysis RecommendationPanel, directly below
 * existing recommendations. Shows supporting content gaps for the current
 * page and provides a path to Content Hub to generate the missing articles.
 *
 * Spec: jumar-spec-supporting-content-cta.md
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/auth-headers';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  BookOpen,
  TrendingUp,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface RecommendedArticle {
  id: string;
  suggested_title: string;
  target_keyword: string;
  search_volume: number;
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  status: 'missing' | 'draft' | 'published';
}

interface SupportingContentData {
  gaps_detected: number;
  recommended_articles: RecommendedArticle[];
  generated_count: number;
  published_count: number;
}

interface SupportingContentSectionProps {
  siteId: number | string;
  pageId: number;
}

// ── Intent badge colors ───────────────────────────────────────────────────────

const INTENT_COLORS: Record<string, string> = {
  informational: 'bg-blue-100 text-blue-700',
  commercial:    'bg-purple-100 text-purple-700',
  transactional: 'bg-green-100 text-green-700',
  navigational:  'bg-gray-100 text-gray-600',
};

const STATUS_COLORS: Record<string, string> = {
  missing:   'bg-red-100 text-red-700',
  draft:     'bg-yellow-100 text-yellow-700',
  published: 'bg-green-100 text-green-700',
};

// ── Component ────────────────────────────────────────────────────────────────

export default function SupportingContentSection({
  siteId,
  pageId,
}: SupportingContentSectionProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [data, setData] = useState<SupportingContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  // Track optimistic status updates
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, 'draft' | 'published'>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchWithAuth(
        `/api/v1/sites/${siteId}/pages/${pageId}/supporting-content/`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('[SupportingContentSection] fetch error:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [siteId, pageId]);

  useEffect(() => {
    if (siteId && pageId) load();
  }, [siteId, pageId, load]);

  const handleGenerate = async (article: RecommendedArticle) => {
    setGeneratingId(article.id);
    try {
      const res = await fetchWithAuth(
        `/api/v1/sites/${siteId}/pages/${pageId}/supporting-content/generate/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ article_id: article.id }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Optimistic update
      setOptimisticStatus(prev => ({ ...prev, [article.id]: 'draft' }));
      toast({
        title: '✅ Article generation started',
        description: 'Check Content Hub for progress.',
      });
    } catch (e) {
      console.error('[SupportingContentSection] generate error:', e);
      toast({
        title: '❌ Generation failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingId(null);
    }
  };

  const goToContentHub = () => {
    router.push(`/dashboard?tab=content-hub&page_id=${pageId}`);
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mt-6 border-t border-slate-100 pt-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-36 bg-slate-200 rounded animate-pulse" />
          <div className="h-5 w-20 bg-slate-200 rounded-full animate-pulse" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 mb-3 p-3 bg-slate-50 rounded-lg animate-pulse">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-slate-200 rounded" />
              <div className="h-3 w-1/2 bg-slate-200 rounded" />
            </div>
            <div className="h-8 w-28 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="mt-6 border-t border-slate-100 pt-5">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <AlertCircle size={16} className="text-amber-400" />
          <span>Couldn&apos;t load supporting content recommendations.</span>
          <button
            onClick={load}
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // ── Empty state ────────────────────────────────────────────────────────────
  if (data.gaps_detected === 0) {
    return (
      <div className="mt-6 border-t border-slate-100 pt-5">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Supporting Content</h3>
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
            <CheckCircle size={11} /> Content complete
          </span>
        </div>
        <p className="text-xs text-slate-500">
          This page has all recommended supporting articles in place. Great Hub &amp; Spoke architecture!
        </p>
      </div>
    );
  }

  // ── Main view ──────────────────────────────────────────────────────────────
  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={16} className="text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-700">Supporting Content</h3>
        {data.gaps_detected > 0 && (
          <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
            {data.gaps_detected} gap{data.gaps_detected !== 1 ? 's' : ''} detected
          </span>
        )}
        <span
          className="text-slate-400 cursor-help text-xs border border-slate-200 rounded-full w-4 h-4 flex items-center justify-center"
          title="These are supporting articles that strengthen this page's authority in the Hub & Spoke architecture."
        >
          ?
        </span>
      </div>

      {/* Article cards */}
      <div className="space-y-2 mb-4">
        {data.recommended_articles.map(article => {
          const effectiveStatus = optimisticStatus[article.id] || article.status;
          const isGenerating = generatingId === article.id;

          return (
            <div
              key={article.id}
              className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
            >
              {/* Article info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {article.suggested_title}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-slate-400 font-mono truncate max-w-[180px]">
                    {article.target_keyword}
                  </span>
                  {article.search_volume > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-slate-400">
                      <TrendingUp size={10} />
                      {article.search_volume.toLocaleString()}/mo
                    </span>
                  )}
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${INTENT_COLORS[article.intent] || 'bg-gray-100 text-gray-600'}`}>
                    {article.intent}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[effectiveStatus] || 'bg-gray-100 text-gray-600'}`}>
                    {effectiveStatus === 'missing' ? 'Missing' : effectiveStatus === 'draft' ? 'Draft' : 'Published'}
                  </span>
                </div>
              </div>

              {/* CTA button */}
              <div className="flex-shrink-0">
                {effectiveStatus === 'missing' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 border-orange-300 text-orange-700 hover:bg-orange-50"
                    onClick={() => handleGenerate(article)}
                    disabled={isGenerating || !!generatingId}
                  >
                    {isGenerating ? (
                      <><RefreshCw size={12} className="mr-1 animate-spin" /> Generating…</>
                    ) : (
                      <><Sparkles size={12} className="mr-1" /> Generate</>
                    )}
                  </Button>
                )}
                {(effectiveStatus === 'draft' || effectiveStatus === 'published') && (
                  <Button
                    size="sm"
                    variant="outline"
                    className={`text-xs h-7 ${effectiveStatus === 'published' ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'}`}
                    onClick={goToContentHub}
                  >
                    View {effectiveStatus === 'published' ? 'Published' : 'Draft'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-700">
          This page needs <strong>{data.gaps_detected}</strong> supporting article{data.gaps_detected !== 1 ? 's' : ''} to complete its Hub &amp; Spoke architecture.
        </p>
        <Button
          size="sm"
          className="text-xs h-7 ml-3 flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={goToContentHub}
        >
          Go to Content Hub <ArrowRight size={12} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}
