'use client';

import { useState, useEffect } from "react";
import { useDashboardContext } from '@/lib/hooks/dashboard-context';
import { useTheme } from '@/lib/hooks/theme-context';
import { fetchWithAuth } from '@/lib/auth-headers';
import ContentUpload from './ContentUpload';
import ContentPreviewModal from '@/components/modals/ContentPreviewModal';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { NoSiteSelected } from '@/components/ui/no-site-selected';

const agentSteps = [
  "Scanning site architecture",
  "Identifying the focus of this page",
  "Connecting related topics",
  "Securing your internal link structure",
  "Generating structured output",
];

interface Recommendation {
  id: string;
  title: string;
  silo: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  searches: number;
}

interface GeneratedContent {
  title: string;
  content: string;
  meta_description: string;
  suggested_slug: string;
  word_count: number;
  silo_id?: number;
}

interface PendingItem {
  id: number;
  title: string;
  silo: string;
  preview: string;
  linksTo: string;
  wordCount: number;
  generatedAt: string;
}

interface PublishedItem {
  id: number;
  title: string;
  silo: string;
  type: string;
  status: string;
  date: string;
}

interface PreviewModalData {
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  body: string;
  wordCount: number;
  targetKeyword?: string;
  suggestedSlug?: string;
  siloId?: number;
}

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const { theme: t } = useTheme();
  const map = {
    high: { bg: t.redBg, color: t.red, border: t.redBorder, label: "High" },
    medium: { bg: t.orangeBg, color: t.orange, border: t.orangeBorder, label: "Medium" },
    low: { bg: t.greenBg, color: t.green, border: t.greenBorder, label: "Low" },
  };
  const c = map[priority];
  return (
    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {c.label}
    </span>
  );
}

function AgentConsole({ onComplete }: { onComplete?: () => void }) {
  const { theme: t } = useTheme();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    if (step < agentSteps.length) {
      const timer = setTimeout(() => { setDone(p => [...p, step]); setStep(p => p + 1); }, 700 + Math.random() * 400);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => onComplete?.(), 400);
      return () => clearTimeout(timer);
    }
  }, [step, onComplete]);

  return (
    <div style={{ background: t.consoleBar, borderRadius: 10, padding: "14px 18px", marginTop: 12, border: `1px solid ${t.accent}30` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: t.green, boxShadow: `0 0 6px ${t.green}80` }} />
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted }}>Agent Console</span>
      </div>
      {agentSteps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "3px 0", opacity: i <= step ? 1 : 0.3, transition: "opacity 0.3s" }}>
          <span style={{ color: t.accent, fontSize: 12, width: 14 }}>→</span>
          <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: done.includes(i) ? t.textMuted : (i === step ? t.accent : t.textDim) }}>{s}...</span>
          {done.includes(i) && <span style={{ color: t.green, fontSize: 14, marginLeft: "auto" }}>✓</span>}
        </div>
      ))}
    </div>
  );
}

interface RecommendationCardProps {
  rec: Recommendation;
  onGenerate: (id: string) => void;
  isGenerating: boolean;
  onDismiss: (id: string) => void;
}

function RecommendationCard({ rec, onGenerate, isGenerating, onDismiss }: RecommendationCardProps) {
  const { theme: t } = useTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      background: t.card, borderRadius: 12, padding: "20px 24px",
      border: `1px solid ${isGenerating ? t.accent + "50" : t.border}`,
      boxShadow: hovered ? t.shadowHover : t.shadow,
      transition: "all 0.2s", position: "relative", overflow: "hidden"
    }}>
      {isGenerating && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${t.accent}, transparent)`, animation: "shimmer 1.5s infinite" }} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: t.text }}>{rec.title}</h3>
            <PriorityBadge priority={rec.priority} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: t.textMuted }}>Supports: <span style={{ color: t.accent, fontWeight: 600 }}>{rec.silo}</span></span>
            <span style={{ fontSize: 12, color: t.textMuted }}>~{rec.searches}/mo searches</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: t.textMuted, lineHeight: 1.55 }}>{rec.reason}</p>
        </div>
        {!isGenerating && (
          <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 16 }}>
            <button onClick={() => onDismiss(rec.id)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${t.border}`, background: "transparent", color: t.textMuted, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>Dismiss</button>
            <button onClick={() => onGenerate(rec.id)} style={{
              padding: "8px 18px", borderRadius: 8, border: "none",
              background: `linear-gradient(135deg, ${t.accent}, #8B5CF6)`,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              boxShadow: `0 2px 10px ${t.accent}35`, transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 6
            }}>⚡ Generate Draft</button>
          </div>
        )}
      </div>

      {isGenerating && <AgentConsole />}
    </div>
  );
}

interface PendingCardProps {
  item: PendingItem;
  onPreview: (item: PendingItem) => void;
  onApprove: (id: number) => void;
}

function PendingCard({ item, onPreview, onApprove }: PendingCardProps) {
  const { theme: t } = useTheme();
  return (
    <div style={{ background: t.card, borderRadius: 12, padding: "20px 24px", border: `1px solid ${t.orangeBorder}`, boxShadow: t.shadow, transition: "all 0.2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: 10, fontWeight: 700, background: t.orangeBg, color: t.orange, border: `1px solid ${t.orangeBorder}`, textTransform: "uppercase", letterSpacing: "0.04em" }}>Awaiting Approval</span>
            <span style={{ fontSize: 12, color: t.textDim }}>{item.generatedAt}</span>
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: t.text }}>{item.title}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: t.textMuted }}>Supports: <span style={{ color: t.accent, fontWeight: 600 }}>{item.silo}</span></span>
            <span style={{ fontSize: 12, color: t.textMuted }}>{item.wordCount} words</span>
            <span style={{ fontSize: 12, color: t.textMuted }}>Links to: <span style={{ color: t.accent, fontWeight: 600 }}>{item.linksTo}</span></span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: t.textMuted, lineHeight: 1.6, maxWidth: 580 }}>{item.preview}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, marginLeft: 20 }}>
          <button onClick={() => onPreview(item)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${t.accent}, #8B5CF6)`, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>👁 Preview & Edit</button>
          <button onClick={() => onApprove(item.id)} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${t.greenBorder}`, background: t.greenBg, color: t.green, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>✓ Quick Approve</button>
          <button style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${t.border}`, background: "transparent", color: t.textMuted, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>Reject</button>
        </div>
      </div>
    </div>
  );
}

interface SuccessBannerProps {
  title: string;
  mode: 'draft' | 'publish';
  onDismiss: () => void;
}

function SuccessBanner({ title, mode, onDismiss }: SuccessBannerProps) {
  const { theme: t } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderRadius: 10, background: t.greenBg, border: `1px solid ${t.greenBorder}`, marginBottom: 14, animation: "fadeIn 0.4s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 15 }}>✅</span>
        <span style={{ fontSize: 14, color: t.green, fontWeight: 600 }}>
          "{title}" {mode === 'publish' ? 'published to' : 'saved as draft in'} WordPress.
        </span>
      </div>
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 16, padding: "2px 6px" }}>×</button>
    </div>
  );
}

export default function ContentHub() {
  const { theme: t, mode } = useTheme();
  const { selectedSite } = useDashboardContext();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [published, setPublished] = useState<PublishedItem[]>([]);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedContents, setGeneratedContents] = useState<Record<string, GeneratedContent>>({});
  const [successBanners, setSuccessBanners] = useState<Array<{ id: number; title: string; mode: 'draft' | 'publish' }>>([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'hub' | 'upload'>('hub');

  // Preview modal state
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    content: PreviewModalData | null;
    isGenerating: boolean;
    generatingStep?: string;
    sourceRecId?: string;
  }>({ open: false, content: null, isGenerating: false });

  const loadData = async () => {
    if (!selectedSite) return;
    
    setIsLoading(true);
    setError(null);
    try {
        const recsResponse = await fetchWithAuth(`/api/v1/sites/${selectedSite.id}/content-recommendations/`);
        if (recsResponse.ok) {
          const recsData = await recsResponse.json();
          const mappedRecs: Recommendation[] = (recsData.recommendations || recsData.results || recsData || []).map((r: any) => ({
            id: r.id,
            title: r.title || r.recommended_title || 'Untitled',
            silo: r.silo || r.silo_name || r.category || 'General',
            reason: r.reason || r.description || 'Content opportunity identified',
            priority: (r.priority || 'medium') as 'high' | 'medium' | 'low',
            searches: r.estimated_searches || r.search_volume || r.monthly_searches || 0,
          }));
          setRecommendations(mappedRecs);
        }

        const pagesResponse = await fetchWithAuth(`/api/v1/pages/?site_id=${selectedSite.id}`);
        if (pagesResponse.ok) {
          const pagesData = await pagesResponse.json();
          const pages = pagesData.results || pagesData || [];
          
          const publishedPages = pages
            .filter((p: any) => p.status === 'publish' || p.status === 'published' || p.status === 'live')
            .map((p: any, idx: number) => ({
              id: p.id || idx,
              title: p.title || 'Untitled',
              silo: p.silo_name || p.category || 'General',
              type: p.type || 'Page',
              status: 'Published',
              date: p.published_date ? new Date(p.published_date).toLocaleDateString() : 'N/A',
            }));

          const pendingPages = pages
            .filter((p: any) => p.status === 'draft' || p.status === 'pending')
            .map((p: any, idx: number) => ({
              id: p.id || idx + 1000,
              title: p.title || 'Untitled',
              silo: p.silo_name || p.category || 'General',
              preview: (p.content || p.excerpt || '').substring(0, 200) + '...',
              linksTo: p.linked_silo || p.silo_name || 'N/A',
              wordCount: p.word_count || 0,
              generatedAt: p.created_date ? new Date(p.created_date).toLocaleDateString() : 'N/A',
            }));

          setPublished(publishedPages);
          setPending(pendingPages);
        }
      } catch (err) {
        console.error('Error loading content hub data:', err);
        setError('Unable to load content recommendations. Please try again.');
        setRecommendations([]);
        setPending([]);
        setPublished([]);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    loadData();
  }, [selectedSite]);

  const handleGenerate = async (id: string) => {
    setGeneratingId(id);
    const rec = recommendations.find(r => r.id === id);
    
    // Open preview modal in generating state
    setPreviewModal({
      open: true,
      content: {
        title: rec?.title || 'Generating...',
        body: '',
        wordCount: 0,
        targetKeyword: rec?.title,
      },
      isGenerating: true,
      generatingStep: 'Generating content with AI...',
      sourceRecId: id,
    });
    
    try {
      const response = await fetchWithAuth(
        `/api/v1/sites/${selectedSite?.id}/content-recommendations/${id}/generate/`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        const data = await response.json();
        const generated: GeneratedContent = {
          title: data.title || '',
          content: data.content || '',
          meta_description: data.meta_description || '',
          suggested_slug: data.suggested_slug || '',
          word_count: data.word_count || 0,
          silo_id: data.silo_id,
        };
        setGeneratedContents(prev => ({ ...prev, [id]: generated }));
        
        // Update preview modal with generated content
        setPreviewModal({
          open: true,
          content: {
            title: generated.title,
            metaTitle: generated.title,
            metaDescription: generated.meta_description,
            body: generated.content,
            wordCount: generated.word_count,
            targetKeyword: rec?.title,
            suggestedSlug: generated.suggested_slug,
            siloId: generated.silo_id,
          },
          isGenerating: false,
          sourceRecId: id,
        });
      } else {
        const errData = await response.json().catch(() => ({}));
        const msg = errData.error || errData.detail || errData.message || `Failed to generate content (${response.status})`;
        setPreviewModal({ open: false, content: null, isGenerating: false });
        alert(msg);
      }
    } catch (error) {
      console.error('Generate error:', error);
      setPreviewModal({ open: false, content: null, isGenerating: false });
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePushToWordPress = async (content: PreviewModalData, publishMode: 'publish' | 'draft') => {
    const response = await fetchWithAuth(
      `/api/v1/sites/${selectedSite?.id}/content/approve/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: content.title,
          content: content.body,
          meta_description: content.metaDescription || '',
          meta_title: content.metaTitle || '',
          slug: content.suggestedSlug || '',
          silo_id: content.siloId,
          publish_status: publishMode === 'publish' ? 'publish' : 'draft',
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to push to WordPress');
    }

    // Remove from recommendations if it came from one
    const recId = previewModal.sourceRecId;
    if (recId) {
      setRecommendations(p => p.filter(r => r.id !== recId));
    }

    // Add to published list
    setPublished(p => [{
      id: Date.now(),
      title: content.title,
      silo: '',
      type: "Blog Post",
      status: publishMode === 'publish' ? 'Published' : 'Draft in WP',
      date: "Just now"
    }, ...p]);

    setSuccessBanners(p => [...p, { id: Date.now(), title: content.title, mode: publishMode }]);
  };

  const handlePreviewPending = (item: PendingItem) => {
    setPreviewModal({
      open: true,
      content: {
        title: item.title,
        body: item.preview,
        wordCount: item.wordCount,
      },
      isGenerating: false,
    });
  };

  const handleApprovePending = async (id: number) => {
    const item = pending.find(p => p.id === id);
    if (!item) return;

    try {
      const response = await fetchWithAuth(
        `/api/v1/sites/${selectedSite?.id}/content/approve/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page_id: id })
        }
      );

      if (response.ok) {
        setPending(p => p.filter(x => x.id !== id));
        setPublished(p => [{
          id: Date.now(),
          title: item.title,
          silo: item.silo,
          type: "Blog Post",
          status: "Draft in WP",
          date: "Just now"
        }, ...p]);
        setSuccessBanners(p => [...p, { id: Date.now(), title: item.title, mode: 'draft' }]);
      }
    } catch (error) {
      console.error('Approve pending error:', error);
    }
  };

  const handleGenerateAllHighPriority = async () => {
    const highPriority = recommendations.filter(r => r.priority === 'high');
    for (const rec of highPriority) {
      await handleGenerate(rec.id);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  if (!selectedSite) {
    return <NoSiteSelected message="Select a site to view content recommendations and manage your content pipeline." />;
  }

  if (isLoading) {
    return <LoadingState message="Calculating content health scores..." />;
  }

  if (error && recommendations.length === 0 && pending.length === 0 && published.length === 0) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  if (activeView === 'upload') {
    return <ContentUpload onBack={() => setActiveView('hub')} />;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      {/* Content Preview Modal */}
      {previewModal.open && previewModal.content && (
        <ContentPreviewModal
          content={previewModal.content}
          isGenerating={previewModal.isGenerating}
          generatingStep={previewModal.generatingStep}
          onClose={() => setPreviewModal({ open: false, content: null, isGenerating: false })}
          onPushToWordPress={handlePushToWordPress}
          siteId={selectedSite.id}
        />
      )}

      <div style={{ padding: "0", maxWidth: 960, fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        {/* Upload Your Own Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button
            onClick={() => setActiveView('upload')}
            style={{
              padding: '10px 20px', borderRadius: 10, border: `1px solid ${t.accent}35`,
              background: t.accentGlow || `${t.accent}10`, color: t.accent,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
            }}
          >
            📤 Upload Your Own
          </button>
        </div>

        {successBanners.map(b => (
          <SuccessBanner key={b.id} title={b.title} mode={b.mode} onDismiss={() => setSuccessBanners(p => p.filter(x => x.id !== b.id))} />
        ))}

        {/* SECTION 1: Recommendations */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: t.text }}>Content Recommendations</h1>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: t.textMuted }}>
                {recommendations.length === 0 ? (
                  "No recommendations yet — check back soon!"
                ) : (
                  <>Siloq analyzed your site and found <span style={{ color: t.accent, fontWeight: 600 }}>{recommendations.length} content opportunities</span></>
                )}
              </p>
            </div>
            {recommendations.filter(r => r.priority === 'high').length > 0 && (
              <button onClick={handleGenerateAllHighPriority} style={{
                padding: "8px 16px", borderRadius: 8,
                border: `1px solid ${t.accent}35`, background: t.accentGlow,
                color: t.accent, fontSize: 13, fontWeight: 600, cursor: "pointer"
              }}>Generate All High Priority</button>
            )}
          </div>
          <p style={{ fontSize: 12, color: t.textDim, margin: "0 0 18px" }}>Ranked by search volume, competitive gaps, and silo completeness</p>

          {recommendations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: t.card, borderRadius: 12, border: `1px solid ${t.border}` }}>
              <p style={{ fontSize: 14, color: t.textMuted }}>No content recommendations available yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recommendations.map(rec => (
                <RecommendationCard
                  key={rec.id} rec={rec}
                  onGenerate={handleGenerate}
                  isGenerating={generatingId === rec.id}
                  onDismiss={(id) => setRecommendations(p => p.filter(r => r.id !== id))}
                />
              ))}
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            {!showCustom ? (
              <button onClick={() => setShowCustom(true)} style={{ background: "none", border: "none", color: t.textDim, fontSize: 13, cursor: "pointer", padding: "8px 0" }}>
                Have a specific topic in mind? Request it here →
              </button>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "12px 16px", background: t.card, borderRadius: 10, border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
                <input value={customTopic} onChange={e => setCustomTopic(e.target.value)}
                  placeholder="What should this page be about? (e.g., emergency roof tarping)"
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: 14, outline: "none" }}
                />
                <button style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${t.accent}, #8B5CF6)`, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>Generate</button>
                <button onClick={() => { setShowCustom(false); setCustomTopic(""); }} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${t.border}`, background: "transparent", color: t.textMuted, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: Pending Approval */}
        {pending.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: t.text }}>Pending Approval</h2>
              <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: t.orangeBg, color: t.orange, border: `1px solid ${t.orangeBorder}` }}>{pending.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pending.map(item => <PendingCard key={item.id} item={item} onPreview={handlePreviewPending} onApprove={handleApprovePending} />)}
            </div>
          </div>
        )}

        {/* SECTION 3: Published Content */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 700, color: t.text }}>Published Content</h2>
          {published.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: t.card, borderRadius: 12, border: `1px solid ${t.border}` }}>
              <p style={{ fontSize: 14, color: t.textMuted }}>No published content yet.</p>
            </div>
          ) : (
            <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: mode === "light" ? "#f0f1f5" : t.sidebar }}>
                    {["Page Title", "Category", "Type", "Status", "Date"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: t.textDim, textAlign: "left", borderBottom: `1px solid ${t.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {published.map((item, i) => (
                    <tr key={item.id} style={{ background: i % 2 === 0 ? t.card : t.tableAlt }}>
                      <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600 }}>
                        <span style={{ color: t.accent, cursor: "pointer" }}>{item.title}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: t.textMuted }}>{item.silo}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: t.textMuted }}>{item.type}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: item.status === "Published" ? t.greenBg : t.orangeBg,
                          color: item.status === "Published" ? t.green : t.orange,
                          border: `1px solid ${item.status === "Published" ? t.greenBorder : t.orangeBorder}`
                        }}>{item.status}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: t.textDim }}>{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
