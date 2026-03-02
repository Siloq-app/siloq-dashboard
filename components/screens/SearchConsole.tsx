'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { gscService, GscSite, Site, conflictsService } from '@/lib/services/api';
import { fetchWithAuth } from '@/lib/auth';
import { toast } from 'sonner';
import ContentPreviewModal from '@/components/modals/ContentPreviewModal';

// ─── Types ───────────────────────────────────────────────────

interface ConflictPage {
  url: string;
  title: string;
  pos: number;
  clicks: number;
  impressions: number;
  ctr: number;
  clickShare: number;
  trend: number[];
}

interface Conflict {
  id: number;
  query: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  conflict_subtype?: string;
  volatility: number;
  totalClicks: number;
  totalImpressions: number;
  pages: ConflictPage[];
}

interface PerformanceSummary {
  clicks: { value: number; delta: number };
  impressions: { value: number; delta: number };
  ctr: { value: number; delta: number };
  avgPosition: { value: number; delta: number };
  positionVolatility: { value: number; delta: number };
}

interface SiteHealth {
  score: number;
  trend: number;
  cleanQueries: number;
  conflictedQueries: number;
  totalPages: number;
}

interface MergePlan {
  hubUrl: string;
  mergeFrom: string[];
  newTitle: string;
  newH2s: string[];
  contentNotes: { type: string; text: string }[];
  wordCount: string;
  targetKeywords: string[];
}

interface SpokeRewritePage {
  url: string;
  currentAngle: string;
  newAngle: string;
  newTitle: string;
  newH2s: string[];
  internalLink: string;
  keywordShift: { from: string; to: string };
  urlChange?: {
    oldSlug: string;
    newSlug: string;
    rationale: string;
  } | null;
}

interface SpokeRewrite {
  pages: SpokeRewritePage[];
}

type ConnectionStep = 'idle' | 'loading' | 'select-property' | 'connecting';

interface Props {
  selectedSite: Site | null;
}

// ─── Constants ───────────────────────────────────────────────

const severityConfig: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: '#FF3B30', bg: '#FF3B3012', label: 'CRITICAL' },
  high: { color: '#FF9500', bg: '#FF950012', label: 'HIGH' },
  medium: { color: '#FFCC00', bg: '#FFCC0012', label: 'MEDIUM' },
  low: { color: '#34C759', bg: '#34C75912', label: 'LOW' },
  info: { color: '#8E8E93', bg: '#8E8E9312', label: 'INFO' },
};

const PAGE_COLORS = ['#6C5CE7', '#00B4D8', '#FF6B6B', '#FFA62B', '#34C759'];

// ─── Sub-Components ──────────────────────────────────────────

function SiloHealthRing({ score, size = 100 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const progress = (score / 100) * circ;
  const color = score >= 80 ? '#34C759' : score >= 60 ? '#FF9500' : '#FF3B30';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ffffff08" strokeWidth="6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={circ - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-black leading-none"
          style={{
            fontSize: size * 0.32,
            color,
            letterSpacing: -2,
          }}
        >
          {score}
        </span>
        <span className="mt-0.5 font-mono text-[8px] tracking-[1.5px] text-slate-500">
          SILO HEALTH
        </span>
      </div>
    </div>
  );
}

function FlipFlopChart({
  pages,
  width = 400,
  height = 120,
}: {
  pages: ConflictPage[];
  width?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 16, bottom: 20, left: 32, right: 12 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const allPositions = pages.flatMap((p) => p.trend);
    if (allPositions.length === 0) return;
    const minPos = Math.min(...allPositions) - 1;
    const maxPos = Math.max(...allPositions) + 1;
    const posRange = maxPos - minPos;

    ctx.strokeStyle = '#ffffff08';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      const posLabel = Math.round(minPos + (posRange / 4) * i);
      ctx.fillStyle = '#5a607060';
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = 'right';
      ctx.fillText(`#${posLabel}`, padding.left - 5, y + 3);
    }

    pages.forEach((page, pi) => {
      const points = page.trend;
      if (points.length === 0) return;
      const color = PAGE_COLORS[pi] || '#888';

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      points.forEach((pos, i) => {
        const x = padding.left + (i / (points.length - 1)) * chartW;
        const y = padding.top + ((pos - minPos) / posRange) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.strokeStyle = color + '30';
      ctx.lineWidth = 6;
      ctx.beginPath();
      points.forEach((pos, i) => {
        const x = padding.left + (i / (points.length - 1)) * chartW;
        const y = padding.top + ((pos - minPos) / posRange) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      const lastX = padding.left + chartW;
      const lastY = padding.top + ((points[points.length - 1] - minPos) / posRange) * chartH;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    ctx.save();
    ctx.translate(8, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#5a607050';
    ctx.font = "8px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('POSITION', 0, 0);
    ctx.restore();
  }, [pages, width, height]);

  return <canvas ref={canvasRef} className="rounded-lg" style={{ width, height }} />;
}

function BattlefieldChart({
  conflicts,
  onSelect,
  selectedId,
}: {
  conflicts: Conflict[];
  onSelect: (id: number | null) => void;
  selectedId: number | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 600, h: 300 });

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDims({ w: rect.width, h: Math.min(320, rect.height || 320) });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = dims;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const padding = { top: 24, bottom: 32, left: 56, right: 24 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const allPages = conflicts.flatMap((c) => c.pages.map((p) => ({ ...p, conflict: c })));
    if (allPages.length === 0) return;
    const maxImp = Math.max(...allPages.map((p) => p.impressions)) * 1.1;
    const maxPos = Math.max(...allPages.map((p) => p.pos)) + 2;

    ctx.strokeStyle = '#ffffff06';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
      ctx.fillStyle = '#5a607050';
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = 'right';
      ctx.fillText(`#${Math.round((maxPos / 5) * i)}`, padding.left - 8, y + 3);
    }
    for (let i = 0; i <= 4; i++) {
      const x = padding.left + (chartW / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, h - padding.bottom);
      ctx.stroke();
      ctx.fillStyle = '#5a607050';
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(((maxImp / 4) * i) / 1000)}k`, x, h - padding.bottom + 16);
    }

    ctx.fillStyle = '#5a607060';
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('IMPRESSIONS →', w / 2, h - 4);
    ctx.save();
    ctx.translate(12, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('← BETTER POSITION', 0, 0);
    ctx.restore();

    conflicts.forEach((conflict) => {
      const isSelected = selectedId === conflict.id;
      const sev = severityConfig[conflict.severity] ?? severityConfig.low;
      const pageCoords = conflict.pages.map((p) => ({
        x: padding.left + (p.impressions / maxImp) * chartW,
        y: padding.top + (p.pos / maxPos) * chartH,
        page: p,
      }));

      if (pageCoords.length > 1) {
        for (let i = 0; i < pageCoords.length; i++) {
          for (let j = i + 1; j < pageCoords.length; j++) {
            ctx.beginPath();
            ctx.moveTo(pageCoords[i].x, pageCoords[i].y);
            ctx.lineTo(pageCoords[j].x, pageCoords[j].y);
            ctx.strokeStyle = isSelected ? sev.color + '80' : sev.color + '30';
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }

      pageCoords.forEach((coord, pi) => {
        const radius = Math.max(6, Math.min(20, coord.page.clicks / 20));
        const color = PAGE_COLORS[pi];

        if (isSelected) {
          ctx.beginPath();
          ctx.arc(coord.x, coord.y, radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = sev.color + '15';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(coord.x, coord.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? color + '60' : color + '30';
        ctx.fill();
        ctx.strokeStyle = isSelected ? color : color + '60';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(coord.x, coord.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });
    });
  }, [conflicts, selectedId, dims]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const { w, h } = dims;
    const padding = { top: 24, bottom: 32, left: 56, right: 24 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const allPages = conflicts.flatMap((c) => c.pages.map((p) => ({ ...p, conflict: c })));
    if (allPages.length === 0) return;
    const maxImp = Math.max(...allPages.map((p) => p.impressions)) * 1.1;
    const maxPos = Math.max(...allPages.map((p) => p.pos)) + 2;

    let closest: Conflict | null = null;
    let minDist = 30;
    conflicts.forEach((c) => {
      c.pages.forEach((p) => {
        const x = padding.left + (p.impressions / maxImp) * chartW;
        const y = padding.top + (p.pos / maxPos) * chartH;
        const d = Math.sqrt((mx - x) ** 2 + (my - y) ** 2);
        if (d < minDist) {
          minDist = d;
          closest = c;
        }
      });
    });
    if (closest)
      onSelect((closest as Conflict).id === selectedId ? null : (closest as Conflict).id);
  };

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: 320 }}>
      <canvas
        ref={canvasRef}
        className="cursor-pointer rounded-lg"
        style={{ width: dims.w, height: dims.h }}
        onClick={handleClick}
      />
    </div>
  );
}

function ClickShareBar({ pages }: { pages: ConflictPage[] }) {
  return (
    <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-md">
      {pages.map((p, i) => (
        <div
          key={i}
          className="relative opacity-70 transition-all duration-500"
          style={{ width: `${p.clickShare}%`, background: PAGE_COLORS[i] }}
        >
          {p.clickShare > 12 && (
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[7px] font-bold text-white">
              {p.clickShare}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function VolatilityPulse({ value }: { value: number }) {
  const color =
    value >= 8 ? '#FF3B30' : value >= 5 ? '#FF9500' : value >= 3 ? '#FFCC00' : '#34C759';
  const pulseSize = Math.min(20, value * 2);
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative flex h-5 w-5 items-center justify-center">
        <div
          className="rounded-full border-[1.5px]"
          style={{
            width: pulseSize,
            height: pulseSize,
            background: color + '20',
            borderColor: `${color}50`,
            animation: value >= 5 ? 'bf-pulse 2s ease infinite' : 'none',
          }}
        />
        <div className="absolute h-[5px] w-[5px] rounded-full" style={{ background: color }} />
      </div>
      <span className="text-base font-bold -tracking-wide" style={{ color }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

// ─── Battlefield UI (Connected State) ────────────────────────

function BattlefieldView({
  selectedSite,
  onReconnect,
}: {
  selectedSite: Site;
  onReconnect?: () => void;
}) {
  const siteId = selectedSite.id;

  // Data state
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [perfSummary, setPerfSummary] = useState<PerformanceSummary | null>(null);
  const [siteHealth, setSiteHealth] = useState<SiteHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedConflict, setSelectedConflict] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'battlefield' | 'list'>('battlefield');
  const [filter, setFilter] = useState<string>('all');
  const [showOnlyCannibalized, setShowOnlyCannibalized] = useState(true);
  const [animateIn, setAnimateIn] = useState(false);
  const [activeAction, setActiveAction] = useState<{ conflictId: number; type: string } | null>(
    null
  );
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<Record<string, boolean>>({});
  const [aiPlans, setAiPlans] = useState<Record<string, MergePlan | SpokeRewrite>>({});

  // BUG 1 FIX: state for ContentPreviewModal (Generate Merge Plan / Rewrite as Spoke)
  const [previewModal, setPreviewModal] = useState<{
    content: { title: string; body: string; wordCount: number; targetKeyword?: string };
  } | null>(null);

  // BUG 1 FIX: state for 301 Map redirect confirmation dialog
  const [redirectConfirm, setRedirectConfirm] = useState<{
    conflict: Conflict;
    fromUrls: string[];
    toUrl: string;
  } | null>(null);
  const [redirectConfirmLoading, setRedirectConfirmLoading] = useState(false);

  // Load data
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [conflictsRes, gscRes, overviewRes] = await Promise.allSettled([
          fetchWithAuth(`/api/v1/sites/${siteId}/cannibalization-issues/`),
          fetchWithAuth(`/api/v1/sites/${siteId}/gsc/data/`),
          fetchWithAuth(`/api/v1/sites/${siteId}/overview/`),
        ]);

        if (cancelled) return;

        // Parse conflicts
        if (conflictsRes.status === 'fulfilled' && conflictsRes.value.ok) {
          const data = await conflictsRes.value.json();
          // API returns { issues: [...] } with keyword/competing_pages fields
          const items = Array.isArray(data) ? data : data.issues || data.results || [];
          const mapped: Conflict[] = items.map((item: Record<string, unknown>, idx: number) => {
            const pages = (item.competing_pages || item.pages || []) as Record<string, unknown>[];
            return {
              id: (item.id as number) || idx + 1,
              query: (item.keyword as string) || (item.query as string) || '',
              severity: (item.severity as string) || 'medium',
              conflict_subtype: (item.conflict_subtype as string) || undefined,
              volatility: (item.volatility as number) || 0,
              totalClicks: (item.total_clicks as number) || (item.totalClicks as number) || 0,
              totalImpressions:
                (item.total_impressions as number) || (item.totalImpressions as number) || 0,
              pages: pages.map((p: Record<string, unknown>) => ({
                url: (p.url as string) || '',
                title: (p.title as string) || '',
                pos: (p.position as number) || (p.pos as number) || 0,
                clicks: (p.clicks as number) || 0,
                impressions: (p.impressions as number) || 0,
                ctr: (p.ctr as number) || 0,
                clickShare:
                  (p.impression_share as number) ||
                  (p.click_share as number) ||
                  (p.clickShare as number) ||
                  0,
                trend: (p.position_trend as number[]) || (p.trend as number[]) || [],
              })),
            };
          });
          setConflicts(mapped);
          // Update health with conflict counts from actual data
          setSiteHealth((prev) => ({
            score: prev?.score ?? 50,
            trend: prev?.trend ?? 0,
            totalPages: prev?.totalPages ?? 0,
            conflictedQueries: mapped.length,
            cleanQueries: Math.max(0, (prev?.totalPages || 0) - mapped.length),
          }));
        }

        // Parse GSC performance
        if (gscRes.status === 'fulfilled' && gscRes.value.ok) {
          const data = await gscRes.value.json();
          const totals = data.totals || data;
          setPerfSummary({
            clicks: { value: totals.clicks || 0, delta: totals.clicks_delta || 0 },
            impressions: { value: totals.impressions || 0, delta: totals.impressions_delta || 0 },
            ctr: {
              value:
                typeof totals.ctr === 'number'
                  ? totals.ctr < 1
                    ? totals.ctr * 100
                    : totals.ctr
                  : 0,
              delta: totals.ctr_delta || 0,
            },
            avgPosition: {
              value: totals.position || totals.avg_position || 0,
              delta: totals.position_delta || 0,
            },
            positionVolatility: {
              value: totals.position_volatility || 0,
              delta: totals.volatility_delta || 0,
            },
          });
        }

        // Parse site overview/health - API returns health_score + total_pages
        if (overviewRes.status === 'fulfilled' && overviewRes.value.ok) {
          const data = await overviewRes.value.json();
          const totalPages = data.total_pages || 0;
          setSiteHealth((prev) => ({
            score: data.silo_health_score || data.health_score || prev?.score || 50,
            trend: data.health_trend || 0,
            cleanQueries:
              data.clean_queries || Math.max(0, totalPages - (prev?.conflictedQueries || 0)),
            conflictedQueries: data.conflicted_queries || prev?.conflictedQueries || 0,
            totalPages,
          }));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  useEffect(() => {
    setTimeout(() => setAnimateIn(true), 80);
  }, []);

  // BUG 1 FIX: AI generation handler — correct action types per spec; opens ContentPreviewModal on response
  const handleAction = async (conflictId: number, type: string, conflictQuery?: string) => {
    const key = `${conflictId}-${type}`;
    if (generated[key] && type !== 'merge_draft' && type !== 'spoke_draft') {
      setActiveAction((prev) =>
        prev?.conflictId === conflictId && prev?.type === type ? null : { conflictId, type }
      );
      return;
    }
    setActiveAction({ conflictId, type });
    setGenerating(true);
    try {
      // Use spec-correct action names: "merge" for merge plan, "spoke_rewrite" for spoke rewrite
      const actionName =
        type === 'merge'
          ? 'merge'
          : type === 'spoke'
            ? 'spoke_rewrite'
            : type === 'merge_draft'
              ? 'merge_draft'
              : 'spoke_draft';

      const response = await fetchWithAuth('/api/v1/ai/generate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionName,
          conflict_id: conflictId,
          site_id: siteId,
        }),
      });
      const data = await response.json();
      // API returns { plan: {...}, id, action, ... } — extract the nested plan
      const plan = data.plan || data;
      setAiPlans((prev) => ({ ...prev, [key]: plan }));
      setGenerated((prev) => ({ ...prev, [key]: true }));

      // Open ContentPreviewModal with formatted plan content
      const mergePlan = plan as MergePlan;
      const spokePlan = plan as SpokeRewrite;
      let htmlBody = data.content || data.body || '';
      let title = data.title || '';

      if ((type === 'merge' || type === 'merge_draft') && !htmlBody) {
        title = mergePlan.newTitle || `Merge Plan — "${conflictQuery || ''}"`;
        htmlBody = [
          `<h2>Hub URL</h2><p><code>${mergePlan.hubUrl || ''}</code></p>`,
          mergePlan.mergeFrom?.length
            ? `<h2>Pages to Merge</h2><ul>${mergePlan.mergeFrom.map((u) => `<li>${u}</li>`).join('')}</ul>`
            : '',
          mergePlan.newH2s?.length
            ? `<h2>Proposed H2 Structure</h2>${mergePlan.newH2s.map((h2) => `<h3>${h2}</h3>`).join('')}`
            : '',
          mergePlan.contentNotes?.length
            ? `<h2>Content Actions</h2>${mergePlan.contentNotes.map((n) => `<p><strong>[${n.type.toUpperCase()}]</strong> ${n.text}</p>`).join('')}`
            : '',
          mergePlan.targetKeywords?.length
            ? `<h2>Target Keywords</h2><p>${mergePlan.targetKeywords.join(', ')}</p>`
            : '',
          mergePlan.wordCount ? `<h2>Estimated Length</h2><p>${mergePlan.wordCount}</p>` : '',
        ]
          .filter(Boolean)
          .join('\n');
      } else if (
        (type === 'spoke' || type === 'spoke_draft') &&
        !htmlBody &&
        spokePlan.pages?.length
      ) {
        title = `Spoke Rewrite Plan — "${conflictQuery || ''}"`;
        htmlBody = spokePlan.pages
          .map((page, i) =>
            [
              `<h2>Spoke ${i + 1}: ${page.url}</h2>`,
              `<p><strong>New Angle:</strong> ${page.newAngle}</p>`,
              `<p><strong>New Title:</strong> ${page.newTitle}</p>`,
              page.newH2s?.length
                ? `<h3>Proposed H2s</h3><ul>${page.newH2s.map((h) => `<li>${h}</li>`).join('')}</ul>`
                : '',
              page.keywordShift
                ? `<p><strong>Keyword Pivot:</strong> <del>${page.keywordShift.from}</del> → <ins>${page.keywordShift.to}</ins></p>`
                : '',
              page.internalLink
                ? `<p><strong>Internal Link to Hub:</strong> ${page.internalLink}</p>`
                : '',
            ]
              .filter(Boolean)
              .join('\n')
          )
          .join('<hr/>');
      }

      if (htmlBody) {
        setPreviewModal({
          content: {
            title: title || `AI Plan — "${conflictQuery || ''}"`,
            body: htmlBody,
            wordCount: htmlBody
              .replace(/<[^>]*>/g, ' ')
              .split(/\s+/)
              .filter(Boolean).length,
            targetKeyword: conflictQuery,
          },
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI generation failed. Please try again.');
      setGenerated((prev) => ({ ...prev, [key]: true }));
      setActiveAction(null);
    } finally {
      setGenerating(false);
    }
  };

  // BUG 1 FIX: Set Primary handler
  const handleSetPrimary = async (conflict: Conflict) => {
    const primaryPage = conflict.pages[0];
    if (!primaryPage) return;
    try {
      await conflictsService.setPrimary(conflict.id, primaryPage.url);
      toast.success(`Set "${primaryPage.url}" as primary page`);
      setConflicts((prev) => prev.filter((c) => c.id !== conflict.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to set primary page');
    }
  };

  // BUG 1 FIX: 301 Map handler — opens confirmation dialog
  const handle301Map = (conflict: Conflict) => {
    const toUrl = conflict.pages[0]?.url || '';
    const fromUrls = conflict.pages
      .slice(1)
      .map((p) => p.url)
      .filter(Boolean);
    setRedirectConfirm({ conflict, fromUrls, toUrl });
  };

  // BUG 1 FIX: Execute redirect after confirmation
  const handleConfirmRedirect = async () => {
    if (!redirectConfirm) return;
    setRedirectConfirmLoading(true);
    try {
      await conflictsService.resolveWithRedirect(redirectConfirm.conflict.id, 'redirect');
      toast.success(
        `301 redirect created: ${redirectConfirm.fromUrls.length} page(s) → ${redirectConfirm.toUrl}`
      );
      setConflicts((prev) => prev.filter((c) => c.id !== redirectConfirm.conflict.id));
      setRedirectConfirm(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create redirect');
    } finally {
      setRedirectConfirmLoading(false);
    }
  };

  // BUG 1 FIX: Acknowledge handler for structural warnings
  const handleAcknowledge = async (conflictId: number, query: string) => {
    try {
      await conflictsService.acknowledge(conflictId);
    } catch {
      // silently ignore
    }
    setConflicts((prev) => prev.filter((c) => c.id !== conflictId));
    toast.success(`Acknowledged: "${query}"`);
  };

  const filtered = filter === 'all' ? conflicts : conflicts.filter((c) => c.severity === filter);

  // Defaults for missing data
  const perf = perfSummary || {
    clicks: { value: 0, delta: 0 },
    impressions: { value: 0, delta: 0 },
    ctr: { value: 0, delta: 0 },
    avgPosition: { value: 0, delta: 0 },
    positionVolatility: { value: 0, delta: 0 },
  };

  const health = siteHealth || {
    score: 0,
    trend: 0,
    cleanQueries: 0,
    conflictedQueries: 0,
    totalPages: 0,
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C5CE7]" />
        <p className="text-sm text-slate-500">Syncing with Google Search Console...</p>
      </div>
    );
  }

  if (error && conflicts.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <Search className="h-6 w-6 text-red-600" />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-sm font-medium text-slate-900">Unable to load data</p>
          <p className="text-sm text-red-400">{error}</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white font-sans text-slate-900">
        <style>{`
        @keyframes bf-pulse { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.4); opacity: 0.3; } }
        @keyframes bf-fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bf-slideRight { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes bf-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

        {/* TOP BAR */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5">
          <div className="flex items-center gap-3.5">
            <img
              src="/symbol.png"
              alt="Siloq"
              className="h-[34px] w-[34px] rounded-[9px] object-contain"
            />
            <div>
              <span className="text-sm font-extrabold -tracking-wide">SILOQ</span>
              <span className="ml-2.5 font-mono text-[10px] tracking-wider text-slate-500">
                GSC PERFORMANCE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-[3px] rounded-[7px] bg-slate-50 p-[3px]">
              {(['battlefield', 'list'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={`cursor-pointer rounded-[5px] border-none px-3.5 py-[5px] font-mono text-[11px] font-semibold tracking-wide transition-all duration-200 ${
                    viewMode === v
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'bg-transparent text-slate-500'
                  }`}
                >
                  {v === 'battlefield' ? 'Battlefield' : 'Conflicts'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 rounded-[7px] border border-[#34C75925] bg-green-50 px-3 py-[5px]">
              <div className="h-1.5 w-1.5 rounded-full bg-[#34C759] shadow-[0_0_8px_#34C759]" />
              <span className="font-mono text-[10px] font-medium text-[#34C759]">SYNCED</span>
            </div>
            {onReconnect && (
              <button
                onClick={onReconnect}
                className="rounded-[7px] border border-slate-200 bg-white px-3 py-[5px] text-[11px] font-semibold text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
              >
                ↻ Reconnect GSC
              </button>
            )}
          </div>
        </div>

        {/* SILO HEALTH + METRICS */}
        <div
          className={`grid grid-cols-[auto_1fr] border-b border-slate-200 transition-all duration-500 ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
        >
          <div className="flex items-center gap-4 border-r border-slate-200 bg-slate-50 px-6 py-4">
            <SiloHealthRing score={health.score} size={88} />
            <div>
              <div className="mb-1 font-mono text-[10px] tracking-wider text-slate-500">
                SITE STATUS
              </div>
              <div className="text-xs leading-relaxed text-[#8892b0]">
                <span className="font-bold text-[#FF6B6B]">{health.conflictedQueries}</span>{' '}
                competing queries
                <br />
                <span className="font-semibold text-[#34C759]">{health.cleanQueries}</span> clean
                queries
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5">
            {[
              {
                label: 'Clicks',
                value: perf.clicks.value.toLocaleString(),
                delta: perf.clicks.delta,
                prefix: '',
              },
              {
                label: 'Impressions',
                value:
                  perf.impressions.value > 1000
                    ? (perf.impressions.value / 1000).toFixed(1) + 'k'
                    : String(perf.impressions.value),
                delta: perf.impressions.delta,
                prefix: '',
              },
              {
                label: 'Avg CTR',
                value: perf.ctr.value.toFixed(2) + '%',
                delta: perf.ctr.delta,
                prefix: '',
              },
              {
                label: 'Avg Position',
                value: perf.avgPosition.value.toFixed(1),
                delta: perf.avgPosition.delta,
                prefix: '#',
                invertDelta: true,
              },
              { label: 'Position Volatility', value: null as string | null, isVolatility: true },
            ].map((m, i) => (
              <div
                key={i}
                className={`px-[18px] py-3.5 ${i < 4 ? 'border-r border-slate-200' : ''} ${m.isVolatility ? 'bg-red-50' : 'bg-slate-50'}`}
              >
                <div
                  className={`mb-1.5 flex items-center gap-1 font-mono text-[9px] uppercase tracking-[1.2px] ${m.isVolatility ? 'text-[#FF6B6B80]' : 'text-slate-500'}`}
                >
                  {m.isVolatility && <span className="text-[10px]">⚡</span>}
                  {m.label}
                </div>
                {m.isVolatility ? (
                  <VolatilityPulse value={perf.positionVolatility.value} />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-[22px] font-bold -tracking-wider text-slate-900">
                      {m.prefix}
                      {m.value}
                    </span>
                    {m.delta !== undefined && (
                      <span
                        className={`font-mono text-[10px] font-semibold ${
                          (m.invertDelta ? m.delta < 0 : m.delta > 0)
                            ? 'text-[#34C759]'
                            : 'text-[#FF3B30]'
                        }`}
                      >
                        {(m.invertDelta ? m.delta < 0 : m.delta > 0) ? '▲' : '▼'}{' '}
                        {Math.abs(m.delta)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid min-h-[calc(100vh-200px)] grid-cols-[220px_1fr]">
          {/* LEFT SIDEBAR */}
          <div className="overflow-y-auto border-r border-slate-200 bg-slate-50 p-4">
            <div className="mb-2.5 font-mono text-[9px] tracking-[1.5px] text-slate-500">
              SILOQ FILTERS
            </div>

            <div
              onClick={() => setShowOnlyCannibalized(!showOnlyCannibalized)}
              className={`mb-1.5 flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 transition-all duration-200 ${
                showOnlyCannibalized
                  ? 'border-[#6C5CE730] bg-[#6C5CE710]'
                  : 'border-slate-200 bg-transparent'
              }`}
            >
              <div
                className={`flex h-3.5 w-3.5 items-center justify-center rounded text-[9px] font-bold text-white transition-all duration-200 ${
                  showOnlyCannibalized ? 'bg-[#6C5CE7]' : 'bg-white/[0.06]'
                }`}
              >
                {showOnlyCannibalized ? '✓' : ''}
              </div>
              <span
                className={`text-[11px] font-medium ${showOnlyCannibalized ? 'text-indigo-600' : 'text-[#8892b0]'}`}
              >
                Competing Only
              </span>
            </div>

            <div className="my-3 h-px bg-slate-50" />

            <div className="mb-2 font-mono text-[9px] tracking-[1.5px] text-slate-500">
              SEVERITY
            </div>

            {['all', 'critical', 'high', 'medium', 'low'].map((f) => {
              const sev =
                f === 'all' ? { color: '#a78bfa', label: 'ALL CONFLICTS' } : severityConfig[f];
              const count =
                f === 'all' ? conflicts.length : conflicts.filter((c) => c.severity === f).length;
              return (
                <div
                  key={f}
                  onClick={() => setFilter(f)}
                  className="mb-[3px] flex cursor-pointer items-center justify-between rounded-[7px] border px-2.5 py-[7px] transition-all duration-200"
                  style={{
                    background: filter === f ? `${sev.color}10` : 'transparent',
                    borderColor: filter === f ? sev.color + '30' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-[7px]">
                    <div
                      className="h-[7px] w-[7px] rounded-sm"
                      style={{ background: sev.color, opacity: filter === f ? 1 : 0.4 }}
                    />
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: filter === f ? sev.color : '#5a6072' }}
                    >
                      {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">{count}</span>
                </div>
              );
            })}

            <div className="my-3 h-px bg-slate-50" />

            <div className="mb-2 font-mono text-[9px] tracking-[1.5px] text-slate-500">
              GSC FILTERS
            </div>
            {['Last 28 days', 'United States', 'All Devices'].map((f, i) => (
              <div
                key={i}
                className="mb-[3px] flex cursor-pointer items-center justify-between rounded-[7px] border border-slate-200 bg-white/[0.015] px-2.5 py-[7px] text-[11px] text-[#8892b0]"
              >
                <span>{f}</span>
                <span className="text-[8px] text-slate-500">▾</span>
              </div>
            ))}
          </div>

          {/* MAIN AREA */}
          <div className="flex flex-col overflow-y-auto">
            {/* Battlefield View */}
            {viewMode === 'battlefield' && (
              <div
                className="border-b border-slate-200 p-5 px-6"
                style={{ animation: 'bf-fadeUp 0.4s ease' }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-bold -tracking-wide">Competing Pages</div>
                    <div className="mt-0.5 font-mono text-[10px] text-slate-500">
                      Pages competing for the same search query · Click to investigate
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {PAGE_COLORS.slice(0, 4).map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 font-mono text-[9px] text-slate-500"
                      >
                        <div className="h-2 w-2 rounded-sm" style={{ background: c }} />
                        {['Hub', 'Page 2', 'Page 3', 'Page 4'][i]}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-100 p-2">
                  <BattlefieldChart
                    conflicts={filtered}
                    onSelect={setSelectedConflict}
                    selectedId={selectedConflict}
                  />
                </div>
              </div>
            )}

            {/* Conflict List */}
            <div className="flex-1 px-6 py-4">
              <div className="mb-3 font-mono text-[11px] tracking-[1.2px] text-slate-500">
                {viewMode === 'battlefield' ? 'CONFLICT DETAILS' : 'CANNIBALIZED QUERIES'} (
                {filtered.length})
              </div>

              {filtered.map((conflict, ci) => {
                const isOpen = selectedConflict === conflict.id;
                const sev = severityConfig[conflict.severity] ?? severityConfig.low;
                return (
                  <div
                    key={conflict.id}
                    className="mb-2 overflow-hidden rounded-xl border transition-all duration-300"
                    style={{
                      borderColor: isOpen ? sev.color + '40' : '#ffffff0a',
                      background: isOpen ? sev.bg : '#ffffff03',
                      animation: animateIn ? `bf-slideRight 0.4s ease ${ci * 60}ms both` : 'none',
                    }}
                  >
                    {/* Row header */}
                    <div
                      onClick={() => setSelectedConflict(isOpen ? null : conflict.id)}
                      className="grid cursor-pointer items-center gap-3 px-4 py-3"
                      style={{ gridTemplateColumns: '1fr 100px 80px 80px 140px 60px' }}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded border px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-[1.2px]"
                            style={{
                              background: sev.bg,
                              color: sev.color,
                              borderColor: sev.color + '25',
                            }}
                          >
                            {sev.label}
                          </span>
                          <span className="text-sm font-semibold -tracking-wide">
                            &ldquo;{conflict.query}&rdquo;
                          </span>
                        </div>
                        <div className="mt-[3px] font-mono text-[10px] text-slate-500">
                          {conflict.pages.length} pages competing
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono text-[9px] tracking-wide text-slate-500">
                          CLICKS
                        </div>
                        <div className="text-[15px] font-bold -tracking-wide">
                          {conflict.totalClicks}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono text-[9px] tracking-wide text-slate-500">IMP</div>
                        <div className="text-[15px] font-bold -tracking-wide">
                          {(conflict.totalImpressions / 1000).toFixed(1)}k
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono text-[9px] tracking-wide text-slate-500">
                          VOLATILITY
                        </div>
                        <VolatilityPulse value={conflict.volatility} />
                      </div>
                      <div>
                        <div className="mb-[3px] font-mono text-[9px] tracking-wide text-slate-500">
                          CLICK SHARE
                        </div>
                        <ClickShareBar pages={conflict.pages} />
                      </div>
                      <div
                        className="text-center text-base text-slate-500 transition-transform duration-300"
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                      >
                        ▾
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div
                        className="border-t px-4 pb-4"
                        style={{ animation: 'bf-fadeUp 0.3s ease', borderColor: sev.color + '15' }}
                      >
                        {/* Flip-Flop Chart */}
                        <div className="my-3 rounded-[10px] border border-slate-200 bg-slate-100 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="font-mono text-[10px] font-semibold tracking-wide text-[#8892b0]">
                              ⚡ FLIP-FLOP DETECTION - 28 Day Position History
                            </div>
                            <div className="flex gap-2.5">
                              {conflict.pages.map((p, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-1 font-mono text-[9px] text-slate-500"
                                >
                                  <div
                                    className="h-[3px] w-2.5 rounded-sm"
                                    style={{ background: PAGE_COLORS[i] }}
                                  />
                                  {p.url.split('/').pop()?.slice(0, 18)}
                                </div>
                              ))}
                            </div>
                          </div>
                          <FlipFlopChart pages={conflict.pages} />
                        </div>

                        {/* Page comparison cards */}
                        <div
                          className="grid gap-2"
                          style={{
                            gridTemplateColumns: `repeat(${Math.min(conflict.pages.length, 3)}, 1fr)`,
                          }}
                        >
                          {conflict.pages.map((page, i) => {
                            const roleLabel =
                              i === 0
                                ? 'HUB TARGET'
                                : page.clickShare < 10
                                  ? 'REDIRECT'
                                  : 'DE-OPTIMIZE';
                            const roleColor =
                              i === 0 ? '#6C5CE7' : page.clickShare < 10 ? '#FF3B30' : '#FF9500';
                            return (
                              <div
                                key={i}
                                className="relative overflow-hidden rounded-[10px] p-3.5 px-4"
                                style={{
                                  background: i === 0 ? '#6C5CE708' : '#ffffff04',
                                  border: `1px solid ${i === 0 ? '#6C5CE725' : '#ffffff0a'}`,
                                }}
                              >
                                {i === 0 && (
                                  <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-[#6C5CE7] to-transparent" />
                                )}

                                <div className="mb-2 flex items-center gap-1.5">
                                  <div
                                    className="h-2.5 w-2.5 rounded"
                                    style={{ background: PAGE_COLORS[i] }}
                                  />
                                  <span
                                    className="rounded px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-wider"
                                    style={{ background: `${roleColor}15`, color: roleColor }}
                                  >
                                    {roleLabel}
                                  </span>
                                  {i === 0 && (
                                    <span className="font-mono text-[8px] text-[#6C5CE7]">
                                      ★ PRIMARY
                                    </span>
                                  )}
                                </div>

                                <div className="mb-0.5 text-xs font-semibold leading-tight text-slate-900">
                                  {page.title}
                                </div>
                                <div className="mb-2.5 break-all font-mono text-[10px] text-[#6C5CE7]">
                                  {page.url}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    { label: 'Position', value: `#${page.pos.toFixed(1)}` },
                                    { label: 'Clicks', value: page.clicks },
                                    { label: 'CTR', value: `${page.ctr}%` },
                                    { label: 'Click Share', value: `${page.clickShare}%` },
                                  ].map((m, j) => (
                                    <div key={j}>
                                      <div className="font-mono text-[8px] tracking-wide text-slate-500">
                                        {m.label}
                                      </div>
                                      <div className="text-sm font-bold -tracking-wide text-[#c8ccd4]">
                                        {m.value}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* BUG 1+2 FIX: Action Bar */}
                        {(() => {
                          // BUG 2 FIX: detect structural_warning by subtype OR zero traffic fallback
                          const isStructuralWarning =
                            conflict.conflict_subtype === 'structural_warning' ||
                            (conflict.totalClicks === 0 && conflict.totalImpressions === 0);

                          if (isStructuralWarning) {
                            // BUG 2 FIX: structural warnings show note + Acknowledge only, NO action buttons
                            return (
                              <div className="mt-3 rounded-[10px] border border-slate-200 bg-slate-100 p-3 px-3.5">
                                <div className="mb-3 flex items-start gap-2">
                                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                                  <p className="text-[12px] leading-relaxed text-slate-600">
                                    No search traffic data yet. Monitor — if both pages start
                                    ranking, they may compete.
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleAcknowledge(conflict.id, conflict.query)}
                                  className="cursor-pointer rounded-[7px] border border-slate-300 bg-white px-3.5 py-1.5 font-sans text-[11px] font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-50"
                                >
                                  ✓ Acknowledge
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div className="mt-3 rounded-[10px] border border-[#6C5CE720] bg-[#6C5CE708] p-3 px-3.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="mr-1 font-mono text-[10px] text-[#8892b0]">
                                  ACTIONS:
                                </span>
                                {[
                                  {
                                    label: 'Set Primary',
                                    icon: '🔒',
                                    color: '#6C5CE7',
                                    type: 'lock',
                                  },
                                  { label: '301 Map', icon: '↗', color: '#FF6B6B', type: '301' },
                                  {
                                    label: 'View Silo Plan',
                                    icon: '◉',
                                    color: '#00B4D8',
                                    type: 'silo',
                                  },
                                  {
                                    label: 'Generate Merge Plan',
                                    icon: '✍️',
                                    color: '#a855f7',
                                    type: 'merge',
                                  },
                                  {
                                    label: 'Rewrite as Spoke',
                                    icon: '🔄',
                                    color: '#FFA62B',
                                    type: 'spoke',
                                  },
                                ].map((action, i) => {
                                  const isActive =
                                    activeAction?.conflictId === conflict.id &&
                                    activeAction?.type === action.type;
                                  // BUG 1 FIX: wire all button onClick handlers
                                  const handleClick = () => {
                                    if (action.type === 'merge' || action.type === 'spoke') {
                                      handleAction(conflict.id, action.type, conflict.query);
                                    } else if (action.type === '301') {
                                      handle301Map(conflict);
                                    } else if (action.type === 'lock') {
                                      handleSetPrimary(conflict);
                                    } else if (action.type === 'silo') {
                                      toast.info(
                                        `View Silo Plan for "${conflict.query}" — coming soon`
                                      );
                                    }
                                  };
                                  return (
                                    <button
                                      key={i}
                                      onClick={handleClick}
                                      className="flex cursor-pointer items-center gap-[5px] rounded-[7px] px-3.5 py-1.5 font-sans text-[11px] font-semibold transition-all duration-200"
                                      style={{
                                        border: `1px solid ${isActive ? action.color + '60' : action.color + '30'}`,
                                        background: isActive
                                          ? `${action.color}25`
                                          : `${action.color}10`,
                                        color: action.color,
                                        boxShadow: isActive ? `0 0 12px ${action.color}20` : 'none',
                                      }}
                                    >
                                      <span className="text-xs">{action.icon}</span>
                                      {action.label}
                                    </button>
                                  );
                                })}
                                <div className="flex-1" />
                                <div className="rounded-md bg-green-50 px-2.5 py-1 font-mono text-[10px] text-[#34C759]">
                                  📈 Est. +{Math.round(conflict.totalClicks * 0.3)} clicks/mo after
                                  resolution
                                </div>
                              </div>

                              {/* Generating state */}
                              {generating && activeAction?.conflictId === conflict.id && (
                                <div
                                  className="mt-3 rounded-[10px] border border-slate-200 bg-slate-100 p-5"
                                  style={{ animation: 'bf-fadeUp 0.3s ease' }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6C5CE730] to-[#a855f730] text-base">
                                      {activeAction.type === 'merge' ? '✍️' : '🔄'}
                                    </div>
                                    <div className="flex-1">
                                      <div className="mb-1 text-xs font-semibold text-indigo-600">
                                        {activeAction.type === 'merge'
                                          ? 'Generating Merge Plan...'
                                          : 'Analyzing Spoke Rewrite Opportunities...'}
                                      </div>
                                      <div className="h-1 overflow-hidden rounded-sm bg-slate-50">
                                        <div
                                          className="h-full rounded-sm"
                                          style={{
                                            background:
                                              'linear-gradient(90deg, transparent, #6C5CE7, transparent)',
                                            backgroundSize: '200% 100%',
                                            animation: 'bf-shimmer 1.5s ease infinite',
                                          }}
                                        />
                                      </div>
                                      <div className="mt-1.5 font-mono text-[10px] text-slate-500">
                                        Analyzing {conflict.pages.length} pages · Comparing content
                                        overlap · Building content structure
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Merge Plan Panel */}
                              {!generating &&
                                activeAction?.conflictId === conflict.id &&
                                activeAction?.type === 'merge' &&
                                generated[`${conflict.id}-merge`] &&
                                (() => {
                                  const plan = aiPlans[`${conflict.id}-merge`] as
                                    | MergePlan
                                    | undefined;
                                  if (!plan || !plan.hubUrl) return null;
                                  return (
                                    <div
                                      className="mt-3 overflow-hidden rounded-xl border border-[#a855f725]"
                                      style={{ animation: 'bf-fadeUp 0.4s ease' }}
                                    >
                                      <div className="border-b border-[#a855f715] bg-gradient-to-br from-[#a855f710] to-[#6C5CE710] px-[18px] py-4">
                                        <div className="mb-2 flex items-center gap-2">
                                          <span className="text-base">✍️</span>
                                          <span className="text-sm font-bold -tracking-wide">
                                            Merge Plan
                                          </span>
                                          <span className="rounded bg-[#a855f720] px-2 py-0.5 font-mono text-[9px] font-semibold tracking-wide text-[#a855f7]">
                                            AI GENERATED
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-[#8892b0]">
                                          Consolidate{' '}
                                          <span className="font-semibold text-[#FF6B6B]">
                                            {plan.mergeFrom.length} pages
                                          </span>{' '}
                                          into{' '}
                                          <span className="font-mono text-[#6C5CE7]">
                                            {plan.hubUrl}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="bg-slate-100 p-[18px]">
                                        <div className="mb-4">
                                          <div className="mb-1.5 font-mono text-[9px] tracking-[1.2px] text-slate-500">
                                            RECOMMENDED TITLE TAG
                                          </div>
                                          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[13px] font-semibold leading-snug text-slate-900">
                                            {plan.newTitle}
                                          </div>
                                        </div>

                                        <div className="mb-4">
                                          <div className="mb-2 font-mono text-[9px] tracking-[1.2px] text-slate-500">
                                            PROPOSED H2 STRUCTURE
                                          </div>
                                          {plan.newH2s.map((h2, i) => (
                                            <div
                                              key={i}
                                              className={`flex items-center gap-2.5 py-1.5 ${i < plan.newH2s.length - 1 ? 'border-b border-slate-200' : ''}`}
                                            >
                                              <span className="min-w-[20px] font-mono text-[9px] font-bold text-[#6C5CE7]">
                                                H2
                                              </span>
                                              <span className="text-xs text-[#c8ccd4]">{h2}</span>
                                            </div>
                                          ))}
                                        </div>

                                        <div className="mb-4">
                                          <div className="mb-2 font-mono text-[9px] tracking-[1.2px] text-slate-500">
                                            CONTENT ACTIONS
                                          </div>
                                          {plan.contentNotes.map((note, i) => {
                                            const noteConfig: Record<
                                              string,
                                              { color: string; icon: string; label: string }
                                            > = {
                                              keep: { color: '#34C759', icon: '✓', label: 'KEEP' },
                                              merge: {
                                                color: '#a855f7',
                                                icon: '⊕',
                                                label: 'MERGE',
                                              },
                                              remove: {
                                                color: '#FF3B30',
                                                icon: '✕',
                                                label: 'REMOVE',
                                              },
                                              redirect: {
                                                color: '#FF9500',
                                                icon: '→',
                                                label: '301',
                                              },
                                            };
                                            const nc = noteConfig[note.type] || noteConfig.keep;
                                            return (
                                              <div
                                                key={i}
                                                className="mb-1 flex gap-2.5 rounded-lg px-3 py-2"
                                                style={{
                                                  background: `${nc.color}06`,
                                                  border: `1px solid ${nc.color}15`,
                                                }}
                                              >
                                                <span
                                                  className="mt-0.5 h-fit rounded px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-wide"
                                                  style={{
                                                    background: `${nc.color}20`,
                                                    color: nc.color,
                                                  }}
                                                >
                                                  {nc.icon} {nc.label}
                                                </span>
                                                <span className="text-[11px] leading-relaxed text-[#8892b0]">
                                                  {note.text}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>

                                        <div className="mb-3.5 grid grid-cols-2 gap-3">
                                          <div className="rounded-lg border border-slate-200 bg-white/[0.015] px-3.5 py-2.5">
                                            <div className="mb-1.5 font-mono text-[9px] tracking-wider text-slate-500">
                                              TARGET KEYWORDS
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                              {plan.targetKeywords.map((kw, i) => (
                                                <span
                                                  key={i}
                                                  className="rounded bg-[#6C5CE715] px-2 py-[3px] font-mono text-[10px] text-indigo-600"
                                                >
                                                  {kw}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                          <div className="rounded-lg border border-slate-200 bg-white/[0.015] px-3.5 py-2.5">
                                            <div className="mb-1.5 font-mono text-[9px] tracking-wider text-slate-500">
                                              ESTIMATED LENGTH
                                            </div>
                                            <div className="text-xs font-semibold text-[#c8ccd4]">
                                              {plan.wordCount}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => handleAction(conflict.id, 'merge_draft')}
                                            disabled={generating}
                                            className="flex-1 cursor-pointer rounded-lg border-none bg-gradient-to-br from-[#a855f7] to-[#6C5CE7] px-4 py-2.5 text-xs font-bold tracking-wide text-white shadow-[0_4px_16px_#a855f730] disabled:opacity-50"
                                          >
                                            {generating &&
                                            String(activeAction?.type) === 'merge_draft'
                                              ? 'Generating...'
                                              : 'Generate Full Draft →'}
                                          </button>
                                          <button className="cursor-pointer rounded-lg border border-white/[0.08] bg-slate-50 px-4 py-2.5 text-xs font-semibold text-[#8892b0]">
                                            Export Plan
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}

                              {/* Spoke Rewrite Panel */}
                              {!generating &&
                                activeAction?.conflictId === conflict.id &&
                                activeAction?.type === 'spoke' &&
                                generated[`${conflict.id}-spoke`] &&
                                (() => {
                                  const rewrite = aiPlans[`${conflict.id}-spoke`] as
                                    | SpokeRewrite
                                    | undefined;
                                  if (!rewrite || !rewrite.pages) return null;
                                  return (
                                    <div
                                      className="mt-3 overflow-hidden rounded-xl border border-[#FFA62B25]"
                                      style={{ animation: 'bf-fadeUp 0.4s ease' }}
                                    >
                                      <div className="border-b border-[#FFA62B15] bg-gradient-to-br from-[#FFA62B10] to-[#FF950010] px-[18px] py-4">
                                        <div className="mb-2 flex items-center gap-2">
                                          <span className="text-base">🔄</span>
                                          <span className="text-sm font-bold -tracking-wide">
                                            Spoke Rewrite Plan
                                          </span>
                                          <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-[9px] font-semibold tracking-wide text-[#FFA62B]">
                                            RESTRUCTURE
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-[#8892b0]">
                                          Differentiate{' '}
                                          <span className="font-semibold text-[#FFA62B]">
                                            {rewrite.pages.length} competing pages
                                          </span>{' '}
                                          into supporting spokes for the hub
                                        </div>
                                      </div>

                                      <div className="bg-slate-100 p-[18px]">
                                        {rewrite.pages.map((page, pi) => (
                                          <div
                                            key={pi}
                                            className={`${pi < rewrite.pages.length - 1 ? 'mb-3.5' : ''} rounded-[10px] border border-slate-200 bg-white/[0.015] p-3.5 px-4`}
                                          >
                                            <div className="mb-2.5 flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#FFA62B]">
                                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[8px] tracking-wide">
                                                SPOKE {pi + 1}
                                              </span>
                                              {page.url}
                                            </div>

                                            <div
                                              className="mb-3 grid items-start gap-2.5"
                                              style={{ gridTemplateColumns: '1fr auto 1fr' }}
                                            >
                                              <div className="rounded-lg border border-[#FF3B3015] bg-red-50 px-3 py-2.5">
                                                <div className="mb-1 font-mono text-[8px] tracking-wider text-[#FF6B6B]">
                                                  CURRENT ANGLE
                                                </div>
                                                <div className="text-[11px] leading-relaxed text-[#8892b0]">
                                                  {page.currentAngle}
                                                </div>
                                              </div>
                                              <div className="mt-3.5 text-lg font-bold text-[#FFA62B]">
                                                →
                                              </div>
                                              <div className="rounded-lg border border-[#34C75915] bg-[#34C75908] px-3 py-2.5">
                                                <div className="mb-1 font-mono text-[8px] tracking-wider text-[#34C759]">
                                                  NEW ANGLE
                                                </div>
                                                <div className="text-[11px] leading-relaxed text-[#c8ccd4]">
                                                  {page.newAngle}
                                                </div>
                                              </div>
                                            </div>

                                            <div className="mb-2.5">
                                              <div className="mb-1 font-mono text-[9px] tracking-wider text-slate-500">
                                                NEW TITLE
                                              </div>
                                              <div className="text-xs font-semibold text-slate-900">
                                                {page.newTitle}
                                              </div>
                                            </div>

                                            <div className="mb-2.5">
                                              <div className="mb-1.5 font-mono text-[9px] tracking-wider text-slate-500">
                                                PROPOSED H2s
                                              </div>
                                              <div className="flex flex-wrap gap-1">
                                                {page.newH2s.map((h2, i) => (
                                                  <span
                                                    key={i}
                                                    className="rounded-[5px] border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] text-[#c8ccd4]"
                                                  >
                                                    {h2}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>

                                            <div className="mb-2.5">
                                              <div className="mb-1 font-mono text-[9px] tracking-wider text-slate-500">
                                                KEYWORD PIVOT
                                              </div>
                                              <div className="flex items-center gap-2 text-[11px]">
                                                <span className="rounded bg-[#FF3B3015] px-2 py-[3px] font-mono text-[#FF6B6B] line-through">
                                                  {page.keywordShift.from}
                                                </span>
                                                <span className="font-bold text-[#FFA62B]">→</span>
                                                <span className="rounded bg-[#34C75915] px-2 py-[3px] font-mono text-[#34C759]">
                                                  {page.keywordShift.to}
                                                </span>
                                              </div>
                                            </div>

                                            {page.urlChange && (
                                              <div className="mb-2.5">
                                                <div className="mb-1 font-mono text-[9px] tracking-wider text-slate-500">
                                                  URL CHANGE
                                                </div>
                                                <div className="mb-1.5 flex items-center gap-2 text-[11px]">
                                                  <span className="rounded bg-[#FF3B3015] px-2 py-[3px] font-mono text-[#FF6B6B] line-through">
                                                    {page.urlChange.oldSlug}
                                                  </span>
                                                  <span className="font-bold text-[#FFA62B]">
                                                    →
                                                  </span>
                                                  <span className="rounded bg-[#34C75915] px-2 py-[3px] font-mono text-[#34C759]">
                                                    {page.urlChange.newSlug}
                                                  </span>
                                                </div>
                                                <div className="px-0.5 text-[10px] leading-relaxed text-[#8892b0]">
                                                  {page.urlChange.rationale}
                                                </div>
                                                <div className="mt-1.5 flex items-center gap-1.5">
                                                  <div className="h-1.5 w-1.5 rounded-full bg-[#FF9500]" />
                                                  <span className="font-mono text-[9px] text-[#FF9500]">
                                                    301 REDIRECT: old → new (auto-created by WP
                                                    plugin)
                                                  </span>
                                                </div>
                                              </div>
                                            )}

                                            <div className="flex items-start gap-2 rounded-lg border border-[#6C5CE715] bg-[#6C5CE708] px-3 py-2">
                                              <span className="mt-0.5 text-xs">🔗</span>
                                              <div>
                                                <div className="mb-0.5 font-mono text-[8px] tracking-wider text-[#6C5CE7]">
                                                  INTERNAL LINK TO HUB
                                                </div>
                                                <div className="text-[11px] leading-relaxed text-[#8892b0]">
                                                  {page.internalLink}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}

                                        <div className="mt-3.5 flex gap-2">
                                          <button
                                            onClick={() => handleAction(conflict.id, 'spoke_draft')}
                                            disabled={generating}
                                            className="flex-1 cursor-pointer rounded-lg border-none bg-gradient-to-br from-[#FFA62B] to-[#FF9500] px-4 py-2.5 text-xs font-bold tracking-wide text-white shadow-[0_4px_16px_#FFA62B30] disabled:opacity-50"
                                          >
                                            {generating &&
                                            String(activeAction?.type) === 'spoke_draft'
                                              ? 'Generating...'
                                              : 'Generate Spoke Content →'}
                                          </button>
                                          <button className="cursor-pointer rounded-lg border border-white/[0.08] bg-slate-50 px-4 py-2.5 text-xs font-semibold text-[#8892b0]">
                                            Export Plan
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="py-12 text-center text-sm text-slate-500">
                  No competing pages detected. Your site structure looks clean! 🎉
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BUG 1 FIX: ContentPreviewModal for Generate Merge Plan / Rewrite as Spoke */}
      {previewModal && (
        <ContentPreviewModal
          content={previewModal.content}
          siteId={siteId}
          onClose={() => setPreviewModal(null)}
          onPushToWordPress={async () => {
            // Push to WordPress not applicable for plans — just close
            setPreviewModal(null);
          }}
        />
      )}

      {/* BUG 1 FIX: 301 Map redirect confirmation dialog */}
      {redirectConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !redirectConfirmLoading && setRedirectConfirm(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-base font-bold text-slate-900">Confirm 301 Redirect</h3>
            <p className="mb-4 text-sm text-slate-500">
              The following pages will be permanently redirected:
            </p>
            <div className="mb-4 space-y-2">
              {redirectConfirm.fromUrls.map((url, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="flex-1 truncate font-mono text-red-600">{url}</span>
                  <span className="shrink-0 text-slate-400">→</span>
                  <span className="flex-1 truncate font-mono text-green-600">
                    {redirectConfirm.toUrl}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRedirectConfirm(null)}
                disabled={redirectConfirmLoading}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRedirect}
                disabled={redirectConfirmLoading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {redirectConfirmLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm 301 Redirect
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────

export default function SearchConsole({ selectedSite }: Props) {
  const isConnected = selectedSite?.gsc_connected === true;

  // Connection state
  const [connectionStep, setConnectionStep] = useState<ConnectionStep>('idle');
  const [gscSites, setGscSites] = useState<GscSite[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showReconnect, setShowReconnect] = useState(false);

  const siteId = selectedSite?.id;

  const handleLoadProperties = async () => {
    setConnectionError(null);
    setConnectionStep('loading');
    try {
      const sites = await gscService.getSites();
      setGscSites(sites);
      setConnectionStep('select-property');
    } catch (err: unknown) {
      setConnectionError(err instanceof Error ? err.message : 'Failed to load properties');
      setConnectionStep('idle');
    }
  };

  // Check URL for GSC callback or error
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gsc_callback') === 'true' || params.get('gsc_connected') === 'true') {
      if (params.get('gsc_connected') === 'true') {
        // Preserve the connected site so it stays selected after reload
        const connectedSiteId = params.get('site_id');
        if (connectedSiteId) {
          localStorage.setItem('siloq-selected-site-id', connectedSiteId);
        }
        // Successful connection - reload to pick up new gsc_connected status
        const url = new URL(window.location.href);
        url.searchParams.delete('gsc_connected');
        url.searchParams.delete('site_id');
        url.searchParams.set('tab', 'search-console');
        window.history.replaceState({}, '', url.toString());
        window.location.reload();
        return;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleLoadProperties();
      const url = new URL(window.location.href);
      url.searchParams.delete('gsc_callback');
      window.history.replaceState({}, '', url.toString());
    }
    if (params.get('gsc_error')) {
      const detail = params.get('detail') || params.get('gsc_error') || 'Connection failed';
      setConnectionError(`Google connection error: ${detail}`);
      const url = new URL(window.location.href);
      url.searchParams.delete('gsc_error');
      url.searchParams.delete('detail');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const handleConnect = async () => {
    setConnectionError(null);
    setConnectionStep('loading');
    try {
      const { url } = await gscService.getAuthUrl(siteId ?? undefined);
      window.location.href = url;
    } catch (err: unknown) {
      setConnectionError(err instanceof Error ? err.message : 'Failed to start authorization');
      setConnectionStep('idle');
    }
  };

  const handleSelectProperty = async (gscUrl: string) => {
    if (!siteId) return;
    setConnectionStep('connecting');
    setConnectionError(null);
    try {
      await gscService.connectSite(siteId, gscUrl);
      setConnectionStep('idle');
      window.location.reload();
    } catch (err: unknown) {
      setConnectionError(err instanceof Error ? err.message : 'Failed to connect property');
      setConnectionStep('select-property');
    }
  };

  // Show connection UI if not connected OR if user chose to reconnect
  if (!isConnected || showReconnect) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Search Console</h2>
          <p className="text-muted-foreground">
            {showReconnect
              ? 'Reconnect Google Search Console to refresh your authorization.'
              : 'Connect Google Search Console to see your search performance data.'}
          </p>
        </div>

        <Card className="mx-auto max-w-lg">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <div className="rounded-full bg-muted p-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">
              {showReconnect ? 'Reconnect Google Search Console' : 'Connect Google Search Console'}
            </h3>
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              {showReconnect
                ? 'Your previous connection may have expired. Re-authorize to restore search data.'
                : 'Link your GSC property to view queries, clicks, impressions, and run analysis powered by real search data.'}
            </p>

            {connectionError && <p className="text-sm text-destructive">{connectionError}</p>}

            {connectionStep === 'select-property' && gscSites.length > 0 ? (
              <div className="w-full space-y-2">
                <p className="text-sm font-medium">Select a property:</p>
                {gscSites.map((site) => (
                  <button
                    key={site.siteUrl}
                    onClick={() => handleSelectProperty(site.siteUrl)}
                    className="flex w-full items-center justify-between rounded-md border p-3 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <span className="truncate">{site.siteUrl}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {site.permissionLevel}
                    </span>
                  </button>
                ))}
              </div>
            ) : connectionStep === 'select-property' && gscSites.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No GSC properties found. Make sure you have access in Google Search Console.
              </p>
            ) : null}

            <Button
              onClick={connectionStep === 'idle' ? handleConnect : handleLoadProperties}
              disabled={connectionStep === 'loading' || connectionStep === 'connecting'}
            >
              {(connectionStep === 'loading' || connectionStep === 'connecting') && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {connectionStep === 'connecting'
                ? 'Connecting...'
                : connectionStep === 'select-property'
                  ? 'Refresh Properties'
                  : showReconnect
                    ? 'Reconnect with Google'
                    : 'Connect with Google'}
            </Button>

            {showReconnect && (
              <Button variant="ghost" size="sm" onClick={() => setShowReconnect(false)}>
                Cancel
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Connected → show Battlefield UI with reconnect option
  return (
    <BattlefieldView selectedSite={selectedSite!} onReconnect={() => setShowReconnect(true)} />
  );
}
