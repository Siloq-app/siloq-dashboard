'use client';

import { useState, useEffect, useCallback } from "react";
import { useDashboardContext } from '@/lib/hooks/dashboard-context';
import { useTheme } from '@/lib/hooks/theme-context';
import { fetchWithAuth } from '@/lib/auth-headers';
import ContentUpload from './ContentUpload';
import ContentPreviewModal from '@/components/modals/ContentPreviewModal';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { NoSiteSelected } from '@/components/ui/no-site-selected';

// ── Types ──────────────────────────────────────────────────────────────────

interface SitePage {
  id: number;
  url: string;
  title: string;
  word_count: number;
  page_type: string;
}

interface TopicPlanItem {
  title: string;
  target_keyword: string;
  content_type: string;
  word_count: number;
  supports_page: string;
  supports_url: string;
  priority: 'high' | 'medium' | 'low';
}

interface SupportingContentData {
  page_id: number;
  word_count: number;
  thin_content: boolean;
  topic_plan: TopicPlanItem[];
  gaps?: string[];
}

interface GeneratedArticle {
  title: string;
  slug: string;
  target_keyword: string;
  meta_description: string;
  content_html: string;
  word_count: number;
  internal_links: { url: string; anchor_text: string }[];
}

interface ImageSuggestion {
  topic: string;
  dall_e_prompt: string;
  alt_text: string;
  style_guidance: string;
  size: string;
}

interface Recommendation {
  id: string;
  title: string;
  silo: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  searches: number;
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

// ── Sub-components ────────────────────────────────────────────────────────

const agentSteps = [
  "Analyzing page architecture",
  "Identifying content gaps",
  "Mapping to hub & spoke structure",
  "Generating internal link plan",
  "Writing full article",
];

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const { theme: t } = useTheme();
  const map = {
    high:   { bg: t.redBg,    color: t.red,    border: t.redBorder,    label: "High" },
    medium: { bg: t.orangeBg, color: t.orange, border: t.orangeBorder, label: "Medium" },
    low:    { bg: t.greenBg,  color: t.green,  border: t.greenBorder,  label: "Low" },
  };
  const c = map[priority];
  return (
    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.04em",
      background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {c.label}
    </span>
  );
}

function AgentConsole({ steps, onComplete }: { steps: string[]; onComplete?: () => void }) {
  const { theme: t } = useTheme();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    if (step < steps.length) {
      const timer = setTimeout(() => { setDone(p => [...p, step]); setStep(p => p + 1); }, 800 + Math.random() * 500);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => onComplete?.(), 400);
      return () => clearTimeout(timer);
    }
  }, [step, steps.length, onComplete]);

  return (
    <div style={{ background: t.consoleBar, borderRadius: 10, padding: "14px 18px", marginTop: 12, border: `1px solid ${t.accent}30` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: t.green, boxShadow: `0 0 6px ${t.green}80`, animation: "pulse 1.5s infinite" }} />
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted }}>Agent Console</span>
      </div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "3px 0", opacity: i <= step ? 1 : 0.3, transition: "opacity 0.3s" }}>
          <span style={{ color: t.accent, fontSize: 12, width: 14 }}>→</span>
          <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
            color: done.includes(i) ? t.textMuted : (i === step ? t.accent : t.textDim) }}>{s}...</span>
          {done.includes(i) && <span style={{ color: t.green, fontSize: 14, marginLeft: "auto" }}>✓</span>}
        </div>
      ))}
    </div>
  );
}

function ThinContentWarning({ wordCount }: { wordCount: number }) {
  const { theme: t } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderRadius: 10,
      background: t.redBg, border: `1px solid ${t.redBorder}`, marginBottom: 20 }}>
      <span style={{ fontSize: 20 }}>⚠️</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.red }}>Thin Content Detected</div>
        <div style={{ fontSize: 13, color: t.textMuted, marginTop: 2 }}>
          This page has only <strong>{wordCount} words</strong>. Google considers pages under 500 words thin content — 
          they rank poorly and may suppress your other pages. Add supporting content below to build authority.
        </div>
      </div>
    </div>
  );
}

function ImageSuggestionCard({
  suggestion, siteId, onImageGenerated
}: {
  suggestion: ImageSuggestion;
  siteId: number;
  onImageGenerated: (url: string, altText: string) => void;
}) {
  const { theme: t } = useTheme();
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/v1/sites/${siteId}/generate-image/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: suggestion.dall_e_prompt, size: suggestion.size }),
      });
      const data = await res.json();
      if (res.ok && data.image_url) {
        setImageUrl(data.image_url);
        onImageGenerated(data.image_url, suggestion.alt_text);
      } else {
        setError(data.error || 'Image generation failed');
      }
    } catch {
      setError('Image generation failed. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ background: t.card, borderRadius: 12, padding: "20px 24px",
      border: `1px solid ${t.border}`, marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>📸</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Suggested Featured Image</span>
      </div>

      {imageUrl ? (
        <div>
          <img src={imageUrl} alt={suggestion.alt_text}
            style={{ width: "100%", maxHeight: 300, objectFit: "cover", borderRadius: 8, marginBottom: 10 }} />
          <div style={{ fontSize: 12, color: t.textMuted }}>
            <strong>Alt text:</strong> {suggestion.alt_text}
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>DALL-E Prompt</div>
            <div style={{ fontSize: 13, color: t.text, background: t.consoleBar, padding: "10px 14px", borderRadius: 8,
              fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5 }}>
              {suggestion.dall_e_prompt}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Alt Text</div>
            <div style={{ fontSize: 13, color: t.text }}>{suggestion.alt_text}</div>
          </div>
          {error && <div style={{ fontSize: 13, color: t.red, marginBottom: 10 }}>⚠️ {error}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleGenerate} disabled={generating} style={{
              padding: "10px 20px", borderRadius: 8, border: "none",
              background: generating ? t.textDim : `linear-gradient(135deg, ${t.accent}, #8B5CF6)`,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: generating ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {generating ? (
                <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #fff",
                  borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Generating...</>
              ) : "🎨 Generate Image with AI"}
            </button>
            <button onClick={() => onImageGenerated('', suggestion.alt_text)} style={{
              padding: "10px 20px", borderRadius: 8, border: `1px solid ${t.border}`,
              background: "transparent", color: t.textMuted, fontSize: 13, cursor: "pointer",
            }}>Use Alt Text Only</button>
          </div>
        </>
      )}
    </div>
  );
}

function TopicCard({
  topic, onGenerate, isGenerating,
}: {
  topic: TopicPlanItem;
  onGenerate: (topic: TopicPlanItem) => void;
  isGenerating: boolean;
}) {
  const { theme: t } = useTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: t.card, borderRadius: 12, padding: "20px 24px",
        border: `1px solid ${isGenerating ? t.accent + "50" : t.border}`,
        boxShadow: hovered ? t.shadowHover : t.shadow, transition: "all 0.2s",
        position: "relative", overflow: "hidden" }}>
      {isGenerating && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${t.accent}, transparent)`,
          animation: "shimmer 1.5s infinite" }} />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <PriorityBadge priority={topic.priority} />
            <span style={{ fontSize: 11, color: t.textDim, textTransform: "uppercase",
              letterSpacing: "0.05em" }}>{topic.content_type.replace(/_/g, ' ')}</span>
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: t.text }}>{topic.title}</h3>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: t.textMuted }}>
              Keyword: <span style={{ color: t.accent }}>{topic.target_keyword}</span>
            </span>
            <span style={{ fontSize: 12, color: t.textMuted }}>~{topic.word_count} words</span>
            <span style={{ fontSize: 12, color: t.textMuted }}>
              Supports: <span style={{ color: t.accent, fontWeight: 600 }}>{topic.supports_page}</span>
            </span>
          </div>
        </div>
        {!isGenerating && (
          <button onClick={() => onGenerate(topic)} style={{
            padding: "10px 20px", borderRadius: 8, border: "none", flexShrink: 0, marginLeft: 16,
            background: `linear-gradient(135deg, ${t.accent}, #8B5CF6)`,
            color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            boxShadow: `0 2px 10px ${t.accent}35`, display: "flex", alignItems: "center", gap: 6,
          }}>⚡ Generate Article</button>
        )}
      </div>
      {isGenerating && <AgentConsole steps={agentSteps} />}
    </div>
  );
}

function ArticlePreviewPanel({
  article, imageSuggestion, siteId, onApprove, onClose,
}: {
  article: GeneratedArticle;
  imageSuggestion: ImageSuggestion | null;
  siteId: number;
  onApprove: (article: GeneratedArticle, imageUrl?: string) => void;
  onClose: () => void;
}) {
  const { theme: t } = useTheme();
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [publishing, setPublishing] = useState(false);

  const handleApprove = async () => {
    setPublishing(true);
    await onApprove(article, generatedImageUrl || undefined);
    setPublishing(false);
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex",
      alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto" }}>
      <div style={{ background: t.bg, borderRadius: 16, width: "100%", maxWidth: 860,
        border: `1px solid ${t.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 28px", borderBottom: `1px solid ${t.border}` }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.accent, textTransform: "uppercase",
              letterSpacing: "0.08em", marginBottom: 4 }}>Article Ready for Review</div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: t.text }}>{article.title}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none",
            color: t.textMuted, cursor: "pointer", fontSize: 22, padding: "4px 8px" }}>×</button>
        </div>

        <div style={{ padding: "28px" }}>
          {/* Stats row */}
          <div style={{ display: "flex", gap: 24, marginBottom: 20, padding: "14px 20px",
            background: t.card, borderRadius: 10, border: `1px solid ${t.border}` }}>
            {[
              { label: "Word Count", value: `${article.word_count} words` },
              { label: "Target Keyword", value: article.target_keyword },
              { label: "Internal Links", value: `${article.internal_links?.length || 0} added` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 700, color: t.textDim, textTransform: "uppercase",
                  letterSpacing: "0.05em", marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Meta description */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, textTransform: "uppercase",
              letterSpacing: "0.05em", marginBottom: 6 }}>Meta Description</div>
            <div style={{ fontSize: 13, color: t.text, padding: "10px 14px", background: t.card,
              borderRadius: 8, border: `1px solid ${t.border}`, lineHeight: 1.55 }}>
              {article.meta_description}
            </div>
          </div>

          {/* Article content */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, textTransform: "uppercase",
              letterSpacing: "0.05em", marginBottom: 6 }}>Article Content</div>
            <div style={{ padding: "20px 24px", background: t.card, borderRadius: 10,
              border: `1px solid ${t.border}`, maxHeight: 400, overflowY: "auto",
              fontSize: 14, lineHeight: 1.7, color: t.text }}
              dangerouslySetInnerHTML={{ __html: article.content_html }} />
          </div>

          {/* Internal links */}
          {article.internal_links?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, textTransform: "uppercase",
                letterSpacing: "0.05em", marginBottom: 8 }}>Internal Links Added</div>
              {article.internal_links.map((link, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
                  background: t.greenBg, borderRadius: 8, border: `1px solid ${t.greenBorder}`, marginBottom: 6 }}>
                  <span style={{ color: t.green }}>🔗</span>
                  <span style={{ fontSize: 13, color: t.text, fontWeight: 600 }}>{link.anchor_text}</span>
                  <span style={{ fontSize: 12, color: t.textMuted }}>→ {link.url}</span>
                </div>
              ))}
            </div>
          )}

          {/* Image suggestion */}
          {imageSuggestion && (
            <ImageSuggestionCard
              suggestion={imageSuggestion}
              siteId={siteId}
              onImageGenerated={(url, _alt) => setGeneratedImageUrl(url)}
            />
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, marginTop: 28, paddingTop: 20,
            borderTop: `1px solid ${t.border}` }}>
            <button onClick={handleApprove} disabled={publishing} style={{
              flex: 1, padding: "14px 24px", borderRadius: 10, border: "none",
              background: publishing ? t.textDim : `linear-gradient(135deg, ${t.accent}, #8B5CF6)`,
              color: "#fff", fontSize: 15, fontWeight: 700, cursor: publishing ? "not-allowed" : "pointer",
              boxShadow: `0 4px 14px ${t.accent}40`,
            }}>
              {publishing ? "Publishing..." : "✓ Approve & Publish to WordPress"}
            </button>
            <button onClick={onClose} style={{
              padding: "14px 24px", borderRadius: 10, border: `1px solid ${t.border}`,
              background: "transparent", color: t.textMuted, fontSize: 15, cursor: "pointer",
            }}>Discard</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessBanner({ title, onDismiss }: { title: string; onDismiss: () => void }) {
  const { theme: t } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 20px", borderRadius: 10, background: t.greenBg,
      border: `1px solid ${t.greenBorder}`, marginBottom: 14, animation: "fadeIn 0.4s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 15 }}>✅</span>
        <span style={{ fontSize: 14, color: t.green, fontWeight: 600 }}>
          "{title}" published to WordPress successfully.
        </span>
      </div>
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: t.textDim, cursor: "pointer", fontSize: 18 }}>×</button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ContentHub() {
  const { theme: t, mode } = useTheme();
  const { selectedSite } = useDashboardContext();

  // Page selector
  const [pages, setPages] = useState<SitePage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [loadingPages, setLoadingPages] = useState(false);

  // Supporting content
  const [supportingData, setSupportingData] = useState<SupportingContentData | null>(null);
  const [loadingSupporting, setLoadingSupporting] = useState(false);

  // Article generation
  const [generatingTopic, setGeneratingTopic] = useState<string | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);
  const [imageSuggestion, setImageSuggestion] = useState<ImageSuggestion | null>(null);
  const [showArticlePreview, setShowArticlePreview] = useState(false);

  // Legacy content-recommendations flow (kept for backward compat)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [published, setPublished] = useState<PublishedItem[]>([]);
  const [previewModal, setPreviewModal] = useState<{ open: boolean; content: PreviewModalData | null; isGenerating: boolean; generatingStep?: string; sourceRecId?: string }>({ open: false, content: null, isGenerating: false });

  const [successBanners, setSuccessBanners] = useState<Array<{ id: number; title: string }>>([]);
  const [activeView, setActiveView] = useState<'hub' | 'upload'>('hub');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Load site pages ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedSite) return;
    setLoadingPages(true);
    fetchWithAuth(`/api/v1/sites/${selectedSite.id}/pages/`)
      .then(r => r.json())
      .then(data => {
        const list: SitePage[] = (data.results || data || []).map((p: any) => ({
          id: p.id,
          url: p.url,
          title: p.title || p.url,
          word_count: p.word_count || 0,
          page_type: p.page_type || '',
        }));
        setPages(list);
      })
      .catch(() => setPages([]))
      .finally(() => setLoadingPages(false));
  }, [selectedSite]);

  // ── Load legacy recommendations + published content ───────────────────────
  const loadLegacyData = useCallback(async () => {
    if (!selectedSite) return;
    setIsLoading(true);
    try {
      const [recsRes, pagesRes] = await Promise.all([
        fetchWithAuth(`/api/v1/sites/${selectedSite.id}/content-recommendations/`),
        fetchWithAuth(`/api/v1/pages/?site_id=${selectedSite.id}`),
      ]);
      if (recsRes.ok) {
        const d = await recsRes.json();
        setRecommendations((d.recommendations || d.results || d || []).map((r: any) => ({
          id: r.id, title: r.title || r.recommended_title || 'Untitled',
          silo: r.silo || r.silo_name || 'General',
          reason: r.reason || r.description || 'Content opportunity identified',
          priority: (r.priority || 'medium') as 'high' | 'medium' | 'low',
          searches: r.estimated_searches || r.search_volume || 0,
        })));
      }
      if (pagesRes.ok) {
        const d = await pagesRes.json();
        const ps = d.results || d || [];
        setPublished(ps.filter((p: any) => ['publish','published','live'].includes(p.status)).map((p: any, i: number) => ({
          id: p.id || i, title: p.title || 'Untitled', silo: p.silo_name || '', type: p.type || 'Page',
          status: 'Published', date: p.published_date ? new Date(p.published_date).toLocaleDateString() : 'N/A',
        })));
        setPending(ps.filter((p: any) => ['draft','pending'].includes(p.status)).map((p: any, i: number) => ({
          id: p.id || i + 1000, title: p.title || 'Untitled', silo: p.silo_name || '',
          preview: (p.content || p.excerpt || '').substring(0, 200) + '...',
          linksTo: p.linked_silo || p.silo_name || 'N/A', wordCount: p.word_count || 0,
          generatedAt: p.created_date ? new Date(p.created_date).toLocaleDateString() : 'N/A',
        })));
      }
    } catch { setError('Unable to load content data.'); }
    finally { setIsLoading(false); }
  }, [selectedSite]);

  useEffect(() => { loadLegacyData(); }, [loadLegacyData]);

  // ── Load supporting content for selected page ─────────────────────────────
  const loadSupportingContent = useCallback(async (pageId: number) => {
    if (!selectedSite) return;
    setLoadingSupporting(true);
    setSupportingData(null);
    try {
      const res = await fetchWithAuth(`/api/v1/sites/${selectedSite.id}/pages/${pageId}/supporting-content/`);
      if (res.ok) {
        const data = await res.json();
        setSupportingData(data);
      }
    } catch { /* non-fatal */ }
    finally { setLoadingSupporting(false); }
  }, [selectedSite]);

  const handlePageSelect = (pageId: number) => {
    setSelectedPageId(pageId);
    setGeneratedArticle(null);
    setShowArticlePreview(false);
    setSupportingData(null);
    loadSupportingContent(pageId);
  };

  // ── Generate article from topic ───────────────────────────────────────────
  const handleGenerateArticle = async (topic: TopicPlanItem) => {
    if (!selectedSite || !selectedPageId) return;
    setGeneratingTopic(topic.title);
    setGeneratedArticle(null);
    setImageSuggestion(null);

    try {
      // Fetch image suggestion in parallel (fast — no AI call)
      const imgPromise = fetchWithAuth(
        `/api/v1/sites/${selectedSite.id}/pages/${selectedPageId}/image-suggestion/?topic=${encodeURIComponent(topic.title)}`
      ).then(r => r.ok ? r.json() : null).catch(() => null);

      // Generate the article
      const res = await fetchWithAuth(
        `/api/v1/sites/${selectedSite.id}/pages/${selectedPageId}/supporting-content/generate/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic }),
        }
      );

      const [articleData, imgData] = await Promise.all([res.json(), imgPromise]);

      if (res.ok && articleData.article) {
        setGeneratedArticle(articleData.article);
        setImageSuggestion(imgData);
        setShowArticlePreview(true);
      } else {
        alert(articleData.error || 'Article generation failed. Please try again.');
      }
    } catch {
      alert('Article generation failed. Please try again.');
    } finally {
      setGeneratingTopic(null);
    }
  };

  // ── Approve & publish ─────────────────────────────────────────────────────
  const handleApproveArticle = async (article: GeneratedArticle, imageUrl?: string) => {
    if (!selectedSite) return;
    try {
      await fetchWithAuth(`/api/v1/sites/${selectedSite.id}/content/approve/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          content: article.content_html,
          meta_description: article.meta_description,
          slug: article.slug,
          publish_status: 'publish',
          featured_image_url: imageUrl || '',
          featured_image_alt: imageSuggestion?.alt_text || '',
        }),
      });
      setSuccessBanners(p => [...p, { id: Date.now(), title: article.title }]);
      setShowArticlePreview(false);
      setGeneratedArticle(null);
    } catch {
      alert('Failed to publish. Please try again.');
    }
  };

  // ── Legacy generate from recommendation ───────────────────────────────────
  const handleGenerateLegacy = async (id: string) => {
    const rec = recommendations.find(r => r.id === id);
    setPreviewModal({ open: true, content: { title: rec?.title || 'Generating...', body: '', wordCount: 0 }, isGenerating: true, generatingStep: 'Generating content...', sourceRecId: id });
    try {
      const res = await fetchWithAuth(`/api/v1/sites/${selectedSite?.id}/content-recommendations/${id}/generate/`, { method: 'POST' });
      if (res.ok) {
        const d = await res.json();
        setPreviewModal({ open: true, content: { title: d.title || '', metaTitle: d.title, metaDescription: d.meta_description, body: d.content, wordCount: d.word_count, suggestedSlug: d.suggested_slug, siloId: d.silo_id }, isGenerating: false, sourceRecId: id });
      } else {
        setPreviewModal({ open: false, content: null, isGenerating: false });
      }
    } catch { setPreviewModal({ open: false, content: null, isGenerating: false }); }
  };

  const handlePushToWordPress = async (content: PreviewModalData, publishMode: 'publish' | 'draft') => {
    await fetchWithAuth(`/api/v1/sites/${selectedSite?.id}/content/approve/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: content.title, content: content.body, meta_description: content.metaDescription || '', slug: content.suggestedSlug || '', silo_id: content.siloId, publish_status: publishMode }),
    });
    if (previewModal.sourceRecId) setRecommendations(p => p.filter(r => r.id !== previewModal.sourceRecId));
    setSuccessBanners(p => [...p, { id: Date.now(), title: content.title }]);
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!selectedSite) return <NoSiteSelected message="Select a site to view content recommendations and manage your content pipeline." />;
  if (isLoading) return <LoadingState message="Loading content hub..." />;
  if (activeView === 'upload') return <ContentUpload onBack={() => setActiveView('hub')} />;

  const selectedPage = pages.find(p => p.id === selectedPageId);

  return (
    <>
      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin    { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      {/* Article preview modal */}
      {showArticlePreview && generatedArticle && (
        <ArticlePreviewPanel
          article={generatedArticle}
          imageSuggestion={imageSuggestion}
          siteId={selectedSite.id}
          onApprove={handleApproveArticle}
          onClose={() => { setShowArticlePreview(false); setGeneratedArticle(null); }}
        />
      )}

      {/* Legacy content preview modal */}
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

      <div style={{ padding: 0, maxWidth: 960, fontFamily: "'DM Sans', -apple-system, sans-serif" }}>

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: t.text }}>Content Hub</h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: t.textMuted }}>
              Identify content gaps, generate supporting articles, and publish directly to WordPress.
            </p>
          </div>
          <button onClick={() => setActiveView('upload')} style={{
            padding: '10px 20px', borderRadius: 10, border: `1px solid ${t.accent}35`,
            background: `${t.accent}10`, color: t.accent, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>📤 Upload Your Own</button>
        </div>

        {/* Success banners */}
        {successBanners.map(b => (
          <SuccessBanner key={b.id} title={b.title} onDismiss={() => setSuccessBanners(p => p.filter(x => x.id !== b.id))} />
        ))}

        {/* ── SECTION: Page Selector + Supporting Content ──────────────────── */}
        <div style={{ background: t.card, borderRadius: 14, padding: "24px 28px",
          border: `1px solid ${t.border}`, marginBottom: 32, boxShadow: t.shadow }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: t.text }}>
            📋 Analyze a Page — Find Content Gaps
          </h2>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: t.textMuted }}>
            Select a page to see thin content issues and get a supporting article plan specific to that page.
          </p>

          {/* Page dropdown */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
            <select
              value={selectedPageId || ''}
              onChange={e => handlePageSelect(Number(e.target.value))}
              style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: `1px solid ${t.border}`,
                background: t.inputBg || t.card, color: t.text, fontSize: 14, outline: "none", cursor: "pointer" }}
            >
              <option value="">— Select a page to analyze —</option>
              {pages.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title || p.url} {p.word_count ? `(${p.word_count} words)` : ''}
                </option>
              ))}
            </select>
            {loadingPages && <span style={{ fontSize: 13, color: t.textMuted }}>Loading pages...</span>}
          </div>

          {/* Results */}
          {loadingSupporting && (
            <div style={{ textAlign: "center", padding: "30px 0", color: t.textMuted, fontSize: 14 }}>
              <div style={{ display: "inline-block", width: 20, height: 20, border: `2px solid ${t.accent}`,
                borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginRight: 10 }} />
              Analyzing page content...
            </div>
          )}

          {supportingData && !loadingSupporting && (
            <>
              {/* Thin content warning */}
              {(supportingData.thin_content || supportingData.word_count < 500) && (
                <ThinContentWarning wordCount={supportingData.word_count} />
              )}

              {/* Topic plan */}
              {supportingData.topic_plan?.length > 0 ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 12 }}>
                    Supporting Content Plan for "{selectedPage?.title}"
                    <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 400, marginLeft: 8 }}>
                      ({supportingData.topic_plan.length} articles suggested)
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {supportingData.topic_plan.map((topic, i) => (
                      <TopicCard
                        key={i}
                        topic={topic}
                        onGenerate={handleGenerateArticle}
                        isGenerating={generatingTopic === topic.title}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "20px", color: t.textMuted, fontSize: 14 }}>
                  No content gaps detected for this page.
                </div>
              )}
            </>
          )}

          {!selectedPageId && !loadingSupporting && (
            <div style={{ textAlign: "center", padding: "30px 0", color: t.textDim, fontSize: 14 }}>
              Select a page above to see its content gap analysis and supporting article plan.
            </div>
          )}
        </div>

        {/* ── SECTION: Legacy Recommendations ──────────────────────────────── */}
        {recommendations.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 700, color: t.text }}>
              Site-Wide Recommendations
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recommendations.map(rec => (
                <div key={rec.id} style={{ background: t.card, borderRadius: 12, padding: "20px 24px",
                  border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: t.text }}>{rec.title}</h3>
                        <PriorityBadge priority={rec.priority} />
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: t.textMuted }}>{rec.reason}</p>
                    </div>
                    <button onClick={() => handleGenerateLegacy(rec.id)} style={{
                      padding: "8px 18px", borderRadius: 8, border: "none", marginLeft: 16, flexShrink: 0,
                      background: `linear-gradient(135deg, ${t.accent}, #8B5CF6)`,
                      color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}>⚡ Generate</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION: Published Content ────────────────────────────────────── */}
        {published.length > 0 && (
          <div>
            <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 700, color: t.text }}>Published Content</h2>
            <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: mode === "light" ? "#f0f1f5" : t.sidebar }}>
                    {["Page Title", "Category", "Type", "Status", "Date"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.05em", color: t.textDim,
                        textAlign: "left", borderBottom: `1px solid ${t.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {published.map((item, i) => (
                    <tr key={item.id} style={{ background: i % 2 === 0 ? t.card : t.tableAlt }}>
                      <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: t.accent }}>{item.title}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: t.textMuted }}>{item.silo}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: t.textMuted }}>{item.type}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: t.greenBg, color: t.green, border: `1px solid ${t.greenBorder}` }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: t.textDim }}>{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
