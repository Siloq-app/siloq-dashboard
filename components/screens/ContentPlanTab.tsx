'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDashboardContext } from '@/lib/hooks/dashboard-context';
import { useToast } from '@/components/ui/use-toast';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { NoSiteSelected } from '@/components/ui/no-site-selected';
import { contentPlanService, authorService, type ContentJob, type AuthorProfile } from '@/lib/services/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface ContentJobLocal {
  id: number;
  blogTitle: string;
  primaryKeyword: string;
  tier: 1 | 2 | 3;
  searchVolume: number;
  status: 'pending_approval' | 'approved' | 'writing' | 'draft_ready' | 'published';
  angle: string;
  internalLinks: string[];
  blogContent: string | null;
  metaDescription: string | null;
  wordCount: number | null;
  authorId: number | null;
  createdAt: string;
  updatedAt: string;
}

function mapJobToLocal(job: ContentJob): ContentJobLocal {
  return {
    id: job.id,
    blogTitle: job.blog_title,
    primaryKeyword: job.primary_keyword,
    tier: job.tier,
    searchVolume: job.search_volume,
    status: job.status,
    angle: job.angle,
    internalLinks: job.internal_links ?? [],
    blogContent: job.blog_content,
    metaDescription: job.meta_description,
    wordCount: job.word_count,
    authorId: (job as any).author_id ?? null,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
  };
}

// ── Step Indicators ──────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: 'Keyword Discovery' },
  { num: 2, label: 'Generate Topics' },
  { num: 3, label: 'Review & Approve' },
  { num: 4, label: 'Write' },
  { num: 5, label: 'Publish' },
];

function StepIndicators({ activeStep }: { activeStep: number }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {STEPS.map((step, i) => {
        const isActive = step.num === activeStep;
        const isPast = step.num < activeStep;
        return (
          <div key={step.num} className="flex items-center">
            {i > 0 && (
              <div
                className={`w-6 sm:w-10 h-0.5 ${
                  isPast ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            )}
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isPast
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}
              >
                {isPast ? '\u2713' : step.num}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  isActive ? 'text-blue-600' : isPast ? 'text-green-600' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tier Badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: 1 | 2 | 3 }) {
  const styles: Record<number, string> = {
    1: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    3: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  };
  const labels: Record<number, string> = {
    1: 'Tier 1',
    2: 'Tier 2',
    3: 'Tier 3',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[tier]}`}>
      {labels[tier]}
    </span>
  );
}

// ── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ContentJobLocal['status'] }) {
  const config: Record<string, { label: string; classes: string; spinner?: boolean }> = {
    pending_approval: { label: 'Pending Approval', classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    approved: { label: 'Approved', classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    writing: { label: 'Writing...', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', spinner: true },
    draft_ready: { label: 'Draft Ready', classes: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
    published: { label: 'Published', classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  };
  const c = config[status] ?? config.pending_approval;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${c.classes}`}>
      {c.spinner && (
        <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {c.label}
    </span>
  );
}

// ── Topic Card ───────────────────────────────────────────────────────────────

// ── Author Mini-Avatar ──────────────────────────────────────────────────────

interface AuthorLocal {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  headshotUrl: string;
  isPrimary: boolean;
}

function mapAuthorBrief(a: AuthorProfile): AuthorLocal {
  return {
    id: a.id,
    fullName: a.full_name,
    firstName: a.first_name,
    lastName: a.last_name,
    headshotUrl: a.headshot_url,
    isPrimary: a.is_primary,
  };
}

function AuthorBadge({ author }: { author: AuthorLocal }) {
  const initials = `${author.firstName.charAt(0)}${author.lastName.charAt(0)}`.toUpperCase();
  return (
    <span className="inline-flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full">
      {author.headshotUrl ? (
        <img src={author.headshotUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
      ) : (
        <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-[9px] font-bold flex items-center justify-center">
          {initials}
        </span>
      )}
      <span className="text-slate-600 dark:text-slate-400">{author.fullName}</span>
    </span>
  );
}

interface TopicCardProps {
  job: ContentJobLocal;
  selected: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onWrite: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onDelete: () => void;
  actionLoading: number | null;
  authors: AuthorLocal[];
  assignedAuthorId: number | null;
  onAuthorChange: (jobId: number, authorId: number | null) => void;
}

function TopicCard({
  job,
  selected,
  onToggle,
  onApprove,
  onWrite,
  onPreview,
  onPublish,
  onDelete,
  actionLoading,
  authors,
  assignedAuthorId,
  onAuthorChange,
}: TopicCardProps) {
  const isLoading = actionLoading === job.id;

  return (
    <div className="flex gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
      {/* Checkbox */}
      <div className="pt-0.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {job.blogTitle}
          </span>
          <TierBadge tier={job.tier} />
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
            {job.searchVolume.toLocaleString()}/mo
          </span>
          <StatusBadge status={job.status} />
        </div>

        <div className="text-xs text-slate-400">{job.primaryKeyword}</div>

        {job.angle && (
          <div className="text-sm text-slate-600 dark:text-slate-400 truncate">{job.angle}</div>
        )}

        {job.internalLinks.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.internalLinks.map((link, i) => (
              <span key={i} className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                {link}
              </span>
            ))}
          </div>
        )}

        {/* Author assignment */}
        {authors.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={assignedAuthorId ?? ''}
              onChange={e => onAuthorChange(job.id, e.target.value ? Number(e.target.value) : null)}
              className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="">No author</option>
              {authors.map(a => (
                <option key={a.id} value={a.id}>{a.fullName}{a.isPrimary ? ' (Primary)' : ''}</option>
              ))}
            </select>
            {assignedAuthorId && (() => {
              const assigned = authors.find(a => a.id === assignedAuthorId);
              return assigned ? <AuthorBadge author={assigned} /> : null;
            })()}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {job.status === 'pending_approval' && (
            <button
              onClick={onApprove}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Approving...' : 'Approve'}
            </button>
          )}
          {job.status === 'approved' && (
            <button
              onClick={onWrite}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Starting...' : 'Write Now'}
            </button>
          )}
          {job.status === 'draft_ready' && (
            <>
              <button
                onClick={onPreview}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Preview
              </button>
              <button
                onClick={onPublish}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Publishing...' : 'Publish to WP'}
              </button>
            </>
          )}
          <button
            onClick={onDelete}
            disabled={isLoading}
            className="px-2 py-1.5 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Preview Modal ────────────────────────────────────────────────────────────

interface PreviewModalProps {
  job: ContentJobLocal;
  onClose: () => void;
  onPublish: () => void;
  publishing: boolean;
}

function PreviewModal({ job, onClose, onPublish, publishing }: PreviewModalProps) {
  // Render blog content as plain text to avoid XSS from untrusted HTML
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <p key={i} className={line.trim() === '' ? 'h-4' : 'text-sm text-slate-700 dark:text-slate-300 leading-relaxed'}>
        {line}
      </p>
    ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate pr-4">Preview: {job.blogTitle}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Meta info */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap gap-4 text-xs text-slate-500">
          <span>Primary keyword: <strong className="text-slate-700 dark:text-slate-300">{job.primaryKeyword}</strong></span>
          {job.wordCount && <span>Word count: <strong className="text-slate-700 dark:text-slate-300">{job.wordCount.toLocaleString()}</strong></span>}
          <TierBadge tier={job.tier} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {job.blogContent ? (
            renderContent(job.blogContent)
          ) : (
            <p className="text-slate-400 text-sm">No content available yet.</p>
          )}

          {job.metaDescription && (
            <div className="mt-6 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Meta Description</div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{job.metaDescription}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          {job.status === 'draft_ready' && (
            <button
              onClick={onPublish}
              disabled={publishing}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-50"
            >
              {publishing ? 'Publishing...' : 'Publish to WP'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Bulk Action Bar ──────────────────────────────────────────────────────────

interface BulkActionBarProps {
  count: number;
  onApproveAll: () => void;
  onDeleteSelected: () => void;
  loading: boolean;
}

function BulkActionBar({ count, onApproveAll, onDeleteSelected, loading }: BulkActionBarProps) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
        {count} topic{count !== 1 ? 's' : ''} selected
      </span>
      <button
        onClick={onApproveAll}
        disabled={loading}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
      >
        Approve All
      </button>
      <button
        onClick={onDeleteSelected}
        disabled={loading}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
      >
        Delete Selected
      </button>
    </div>
  );
}

// ── Tier Section ─────────────────────────────────────────────────────────────

const TIER_HEADERS: Record<number, string> = {
  1: 'Tier 1 \u2014 Pillar Pages',
  2: 'Tier 2 \u2014 Cluster Content',
  3: 'Tier 3 \u2014 Long-tail Posts',
};

// ── Main Component ───────────────────────────────────────────────────────────

export default function ContentPlanTab() {
  const { selectedSite } = useDashboardContext();
  const { toast } = useToast();

  const [jobs, setJobs] = useState<ContentJobLocal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [previewJob, setPreviewJob] = useState<ContentJobLocal | null>(null);
  const [publishingPreview, setPublishingPreview] = useState(false);
  const [authors, setAuthors] = useState<AuthorLocal[]>([]);

  // ── Computed ────────────────────────────────────────────────────────────────

  const activeStep = (() => {
    if (jobs.length === 0) return 1;
    const hasPublished = jobs.some(j => j.status === 'published');
    const hasDraftReady = jobs.some(j => j.status === 'draft_ready');
    const hasWriting = jobs.some(j => j.status === 'writing');
    const hasApproved = jobs.some(j => j.status === 'approved');
    if (hasPublished) return 5;
    if (hasDraftReady) return 5;
    if (hasWriting) return 4;
    if (hasApproved) return 4;
    return 3;
  })();

  const jobsByTier = (tier: 1 | 2 | 3) => jobs.filter(j => j.tier === tier);

  // ── Load jobs ───────────────────────────────────────────────────────────────

  const loadJobs = useCallback(async () => {
    if (!selectedSite) return;
    setLoading(true);
    setError(null);
    try {
      const data = await contentPlanService.listContentJobs(selectedSite.id);
      setJobs(data.map(mapJobToLocal));
    } catch (err: any) {
      setError(err?.message || 'Failed to load content jobs');
    } finally {
      setLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // ── Load authors for dropdown ─────────────────────────────────────────────

  useEffect(() => {
    if (!selectedSite) return;
    authorService.listAuthors(selectedSite.id)
      .then(data => setAuthors(data.map(mapAuthorBrief)))
      .catch(() => {});
  }, [selectedSite]);

  const handleAuthorChange = async (jobId: number, authorId: number | null) => {
    if (!selectedSite) return;
    try {
      await contentPlanService.updateContentJob(selectedSite.id, jobId, { author_id: authorId } as any);
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, authorId } : j));
    } catch (err: any) {
      toast({ title: 'Failed to assign author', description: err?.message, variant: 'destructive' });
    }
  };

  // ── Generate Topics flow ────────────────────────────────────────────────────

  const handleGenerateTopics = async () => {
    if (!selectedSite || generating) return;
    setGenerating(true);
    setGenerateStatus('Running keyword discovery...');
    try {
      await contentPlanService.keywordDiscovery(selectedSite.id);
      setGenerateStatus('Keywords discovered, generating topics...');
      const result = await contentPlanService.generateTopics(selectedSite.id, 10);
      await loadJobs();
      toast({ title: `${result.count ?? 'New'} topics generated` });
    } catch (err: any) {
      toast({
        title: 'Generation failed',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
      setGenerateStatus('');
    }
  };

  // ── Single actions ──────────────────────────────────────────────────────────

  const handleApprove = async (job: ContentJobLocal) => {
    if (!selectedSite) return;
    setActionLoading(job.id);
    try {
      await contentPlanService.updateContentJob(selectedSite.id, job.id, { status: 'approved' } as any);
      await contentPlanService.writeContentJob(selectedSite.id, job.id);
      await loadJobs();
      toast({ title: `"${job.blogTitle}" approved and writing started` });
    } catch (err: any) {
      toast({ title: 'Approve failed', description: err?.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleWrite = async (job: ContentJobLocal) => {
    if (!selectedSite) return;
    setActionLoading(job.id);
    try {
      await contentPlanService.writeContentJob(selectedSite.id, job.id);
      await loadJobs();
      toast({ title: `Writing started for "${job.blogTitle}"` });
    } catch (err: any) {
      toast({ title: 'Write failed', description: err?.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = async (job: ContentJobLocal) => {
    if (!selectedSite) return;
    setActionLoading(job.id);
    try {
      await contentPlanService.publishContentJob(selectedSite.id, job.id);
      await loadJobs();
      toast({ title: `"${job.blogTitle}" published to WordPress` });
    } catch (err: any) {
      toast({ title: 'Publish failed', description: err?.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (job: ContentJobLocal) => {
    if (!selectedSite) return;
    setActionLoading(job.id);
    try {
      await contentPlanService.deleteContentJob(selectedSite.id, job.id);
      setJobs(prev => prev.filter(j => j.id !== job.id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
      toast({ title: `"${job.blogTitle}" deleted` });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err?.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  // ── Preview publish ─────────────────────────────────────────────────────────

  const handlePublishFromPreview = async () => {
    if (!previewJob || !selectedSite) return;
    setPublishingPreview(true);
    try {
      await contentPlanService.publishContentJob(selectedSite.id, previewJob.id);
      await loadJobs();
      toast({ title: `"${previewJob.blogTitle}" published to WordPress` });
      setPreviewJob(null);
    } catch (err: any) {
      toast({ title: 'Publish failed', description: err?.message, variant: 'destructive' });
    } finally {
      setPublishingPreview(false);
    }
  };

  // ── Bulk actions ────────────────────────────────────────────────────────────

  const handleBulkApprove = async () => {
    if (!selectedSite) return;
    setBulkLoading(true);
    const pending = jobs.filter(j => selectedIds.has(j.id) && j.status === 'pending_approval');
    try {
      for (const job of pending) {
        await contentPlanService.updateContentJob(selectedSite.id, job.id, { status: 'approved' } as any);
        await contentPlanService.writeContentJob(selectedSite.id, job.id);
      }
      await loadJobs();
      setSelectedIds(new Set());
      toast({ title: `${pending.length} topic${pending.length !== 1 ? 's' : ''} approved` });
    } catch (err: any) {
      toast({ title: 'Bulk approve failed', description: err?.message, variant: 'destructive' });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedSite) return;
    setBulkLoading(true);
    const toDelete = jobs.filter(j => selectedIds.has(j.id));
    try {
      for (const job of toDelete) {
        await contentPlanService.deleteContentJob(selectedSite.id, job.id);
      }
      setJobs(prev => prev.filter(j => !selectedIds.has(j.id)));
      setSelectedIds(new Set());
      toast({ title: `${toDelete.length} topic${toDelete.length !== 1 ? 's' : ''} deleted` });
    } catch (err: any) {
      toast({ title: 'Bulk delete failed', description: err?.message, variant: 'destructive' });
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (!selectedSite) {
    return <NoSiteSelected message="Select a site to view its content plan." />;
  }

  if (loading && jobs.length === 0) {
    return <LoadingState message="Loading content plan..." />;
  }

  if (error && jobs.length === 0) {
    return <ErrorState message={error} onRetry={loadJobs} />;
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const renderTierGroup = (tier: 1 | 2 | 3) => {
    const tierJobs = jobsByTier(tier);
    if (tierJobs.length === 0) return null;
    return (
      <div key={tier}>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
          {TIER_HEADERS[tier]}
        </h3>
        <div className="space-y-3">
          {tierJobs.map(job => (
            <TopicCard
              key={job.id}
              job={job}
              selected={selectedIds.has(job.id)}
              onToggle={() => toggleSelection(job.id)}
              onApprove={() => handleApprove(job)}
              onWrite={() => handleWrite(job)}
              onPreview={() => setPreviewJob(job)}
              onPublish={() => handlePublish(job)}
              onDelete={() => handleDelete(job)}
              actionLoading={actionLoading}
              authors={authors}
              assignedAuthorId={job.authorId}
              onAuthorChange={handleAuthorChange}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Content Plan</h1>
          <p className="text-sm text-slate-500 mt-1">
            DataForSEO-powered content pipeline &mdash; discover keywords, generate topics, write, and publish.
          </p>
        </div>
        <button
          onClick={handleGenerateTopics}
          disabled={generating}
          className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
        >
          {generating ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {generateStatus || 'Generating...'}
            </>
          ) : (
            'Generate Topics'
          )}
        </button>
      </div>

      {/* Step Indicators */}
      <StepIndicators activeStep={jobs.length === 0 ? 1 : activeStep} />

      {/* Bulk Action Bar */}
      <BulkActionBar
        count={selectedIds.size}
        onApproveAll={handleBulkApprove}
        onDeleteSelected={handleBulkDelete}
        loading={bulkLoading}
      />

      {/* Content */}
      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No topics yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md">
              Click &quot;Generate Topics&quot; to run keyword discovery and create a content plan for your site.
            </p>
          </div>
          <button
            onClick={handleGenerateTopics}
            disabled={generating}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60"
          >
            {generating ? 'Generating...' : 'Generate Topics'}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {([1, 2, 3] as const).map(tier => renderTierGroup(tier))}
        </div>
      )}

      {/* Preview Modal */}
      {previewJob && (
        <PreviewModal
          job={previewJob}
          onClose={() => setPreviewJob(null)}
          onPublish={handlePublishFromPreview}
          publishing={publishingPreview}
        />
      )}
    </div>
  );
}
