'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Target } from 'lucide-react';
import { toast } from 'sonner';
import { goalsService, pagesService, type SiteGoals, type PrimaryGoal, type GoalPriorityLocation, type Page } from '@/lib/services/api';
import { Card } from '@/components/ui/card';

// ── Constants ─────────────────────────────────────────────────────────────────

interface GoalOption {
  value: PrimaryGoal;
  label: string;
  desc: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  { value: 'local_leads',       label: 'Local Leads',       desc: 'Get more phone calls / leads from local customers' },
  { value: 'ecommerce_sales',   label: 'E-commerce Sales',  desc: 'Drive more product sales' },
  { value: 'topic_authority',   label: 'Topic Authority',   desc: 'Build authority on a specific topic or keyword' },
  { value: 'multi_location',    label: 'Multi-Location',    desc: 'Rank in multiple cities / expand service areas' },
  { value: 'geo_citations',     label: 'AI/GEO Citations',  desc: 'Be cited by ChatGPT, Perplexity, Google AI Overviews' },
  { value: 'organic_growth',    label: 'Organic Growth',    desc: 'Grow overall organic traffic' },
];

const SHOW_LOCATIONS: PrimaryGoal[] = ['local_leads', 'multi_location'];
const MAX_SERVICES  = 5;
const MAX_LOCATIONS = 5;
const MAX_GEO_PAGES = 3;

// ── Helpers ───────────────────────────────────────────────────────────────────

function emptyLocation(rank: number): GoalPriorityLocation {
  return { city: '', state: '', rank };
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  siteId: number;
  onNavigateToSettings?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GoalsTab({ siteId, onNavigateToSettings }: Props) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [primaryGoal,        setPrimaryGoal]        = useState<PrimaryGoal | ''>('');
  const [priorityServices,   setPriorityServices]   = useState<string[]>(['']);
  const [priorityLocations,  setPriorityLocations]  = useState<GoalPriorityLocation[]>([emptyLocation(1)]);
  const [geoPriorityPageIds, setGeoPriorityPageIds] = useState<number[]>([]);

  const [pages,      setPages]      = useState<Page[]>([]);
  const [pageSearch, setPageSearch] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving,  setIsSaving]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // ── Load existing goals + pages on mount ───────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [goals, sitePages] = await Promise.all([
        goalsService.get(siteId),
        pagesService.list(siteId),
      ]);

      if (goals) {
        if (goals.primary_goal) setPrimaryGoal(goals.primary_goal);
        if (goals.priority_services?.length)  setPriorityServices(goals.priority_services);
        if (goals.priority_locations?.length) setPriorityLocations(goals.priority_locations);
        if (goals.geo_priority_pages?.length) setGeoPriorityPageIds(goals.geo_priority_pages);
      }

      setPages(sitePages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load goals';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [siteId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Service helpers ────────────────────────────────────────────────────────
  const addService = () => {
    if (priorityServices.length < MAX_SERVICES) {
      setPriorityServices([...priorityServices, '']);
    }
  };

  const updateService = (idx: number, value: string) => {
    const updated = [...priorityServices];
    updated[idx] = value;
    setPriorityServices(updated);
  };

  const removeService = (idx: number) => {
    if (priorityServices.length <= 1) {
      setPriorityServices(['']);
      return;
    }
    setPriorityServices(priorityServices.filter((_, i) => i !== idx));
  };

  // ── Location helpers ───────────────────────────────────────────────────────
  const addLocation = () => {
    if (priorityLocations.length < MAX_LOCATIONS) {
      setPriorityLocations([...priorityLocations, emptyLocation(priorityLocations.length + 1)]);
    }
  };

  const updateLocation = (idx: number, field: keyof GoalPriorityLocation, value: string | number) => {
    const updated = priorityLocations.map((loc, i) =>
      i === idx ? { ...loc, [field]: value } : loc
    );
    setPriorityLocations(updated);
  };

  const removeLocation = (idx: number) => {
    if (priorityLocations.length <= 1) {
      setPriorityLocations([emptyLocation(1)]);
      return;
    }
    const filtered = priorityLocations
      .filter((_, i) => i !== idx)
      .map((loc, i) => ({ ...loc, rank: i + 1 }));
    setPriorityLocations(filtered);
  };

  // ── GEO page helpers ───────────────────────────────────────────────────────
  const toggleGeoPage = (pageId: number) => {
    if (geoPriorityPageIds.includes(pageId)) {
      setGeoPriorityPageIds(geoPriorityPageIds.filter(id => id !== pageId));
    } else if (geoPriorityPageIds.length < MAX_GEO_PAGES) {
      setGeoPriorityPageIds([...geoPriorityPageIds, pageId]);
    } else {
      toast.warning(`You can only select up to ${MAX_GEO_PAGES} GEO priority pages.`);
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!primaryGoal) {
      toast.error('Please select a primary goal.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: SiteGoals = {
        primary_goal:        primaryGoal,
        priority_services:   priorityServices.filter(s => s.trim() !== ''),
        priority_locations:  SHOW_LOCATIONS.includes(primaryGoal as PrimaryGoal)
          ? priorityLocations.filter(l => l.city.trim() !== '' || l.state.trim() !== '')
          : [],
        geo_priority_pages:  geoPriorityPageIds,
      };
      await goalsService.save(siteId, payload);
      toast.success('Goals saved successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save goals';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Filtered pages for search ──────────────────────────────────────────────
  const filteredPages = pageSearch.trim()
    ? pages.filter(p =>
        p.title.toLowerCase().includes(pageSearch.toLowerCase()) ||
        p.url.toLowerCase().includes(pageSearch.toLowerCase())
      )
    : pages;

  const showLocations = primaryGoal && SHOW_LOCATIONS.includes(primaryGoal as PrimaryGoal);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[30vh] gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading goals…</p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        {error}
        <button
          onClick={loadData}
          className="ml-2 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Target size={20} className="text-indigo-600 dark:text-indigo-400" />
          Goals
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tell Siloq what you're optimizing for so it can tailor recommendations.
        </p>
      </div>

      {/* ── Section 1: Primary Goal ── */}
      <section className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Primary Goal
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Choose the main outcome you want to achieve with SEO.
          </p>
        </div>

        <div className="space-y-2">
          {GOAL_OPTIONS.map(opt => {
            const selected = primaryGoal === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex items-start gap-3 cursor-pointer rounded-lg border p-4 transition-colors ${
                  selected
                    ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/30 dark:hover:border-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="primary_goal"
                  value={opt.value}
                  checked={selected}
                  onChange={() => setPrimaryGoal(opt.value)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
                />
                <div className="min-w-0">
                  <span className={`text-sm font-medium ${selected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-slate-100'}`}>
                    {opt.label}
                  </span>
                  <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                    — {opt.desc}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      {/* ── Section 2: Priority Services ── */}
      <section className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Priority Services
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            What are your most important services or products?
          </p>
        </div>

        <div className="space-y-2">
          {priorityServices.map((svc, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={svc}
                onChange={e => updateService(idx, e.target.value)}
                placeholder={`Service ${idx + 1}`}
                className="flex h-9 flex-1 rounded-md border border-slate-200 bg-transparent px-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 dark:border-slate-700"
              />
              <button
                type="button"
                onClick={() => removeService(idx)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-800"
                aria-label="Remove service"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        {priorityServices.length < MAX_SERVICES && (
          <button
            type="button"
            onClick={addService}
            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <Plus size={15} />
            Add another
          </button>
        )}
      </section>

      {/* ── Section 3: Priority Locations (conditional) ── */}
      {showLocations && (
        <section className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Priority Locations
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Which cities do you most want to rank in?
            </p>
          </div>

          <div className="space-y-2">
            {priorityLocations.map((loc, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-center text-sm font-semibold text-slate-400">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={loc.city}
                  onChange={e => updateLocation(idx, 'city', e.target.value)}
                  placeholder="City"
                  className="flex h-9 flex-1 rounded-md border border-slate-200 bg-transparent px-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 dark:border-slate-700"
                />
                <input
                  type="text"
                  value={loc.state}
                  onChange={e => updateLocation(idx, 'state', e.target.value.slice(0, 2).toUpperCase())}
                  placeholder="ST"
                  maxLength={2}
                  className="flex h-9 w-16 shrink-0 rounded-md border border-slate-200 bg-transparent px-3 text-center text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => removeLocation(idx)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-800"
                  aria-label="Remove location"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {priorityLocations.length < MAX_LOCATIONS && (
            <button
              type="button"
              onClick={addLocation}
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <Plus size={15} />
              Add location
            </button>
          )}
        </section>
      )}

      {/* ── Section 4: GEO Priority Pages ── */}
      <section className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            GEO Priority Pages
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Which 3 pages do you most want AI assistants like ChatGPT to cite?{' '}
            <span className="text-slate-400">
              ({geoPriorityPageIds.length}/{MAX_GEO_PAGES} selected)
            </span>
          </p>
        </div>

        {pages.length === 0 ? (
          <Card className="border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">
            Sync your pages first to select GEO priority pages.
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Search */}
            <input
              type="text"
              value={pageSearch}
              onChange={e => setPageSearch(e.target.value)}
              placeholder="Search pages…"
              className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 dark:border-slate-700"
            />

            {/* Selected chips */}
            {geoPriorityPageIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {geoPriorityPageIds.map(id => {
                  const pg = pages.find(p => p.id === id);
                  if (!pg) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                    >
                      {pg.title || pg.url}
                      <button
                        type="button"
                        onClick={() => toggleGeoPage(id)}
                        className="ml-1 text-indigo-400 hover:text-indigo-600"
                        aria-label={`Remove ${pg.title}`}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Page list */}
            <div className="max-h-56 overflow-y-auto space-y-1 rounded-lg border border-slate-200 dark:border-slate-700">
              {filteredPages.length === 0 ? (
                <p className="px-3 py-3 text-sm text-slate-400">No pages match your search.</p>
              ) : (
                filteredPages.map(pg => {
                  const isSelected = geoPriorityPageIds.includes(pg.id);
                  const isDisabled = !isSelected && geoPriorityPageIds.length >= MAX_GEO_PAGES;
                  return (
                    <button
                      key={pg.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => toggleGeoPage(pg.id)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/20'
                          : isDisabled
                          ? 'cursor-not-allowed opacity-40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Checkbox-style indicator */}
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-white transition-colors ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 dark:border-indigo-400 dark:bg-indigo-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && (
                          <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-current" aria-hidden="true">
                            <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className={`truncate font-medium ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          {pg.title || '(Untitled)'}
                        </div>
                        <div className="truncate text-xs text-slate-400">{pg.url}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Save button ── */}
      <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving…
            </>
          ) : (
            'Save Goals'
          )}
        </button>
      </div>
    </div>
  );
}
