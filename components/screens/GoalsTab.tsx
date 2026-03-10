'use client';

import { useState, useEffect, useCallback } from 'react';
import { goalsService, pagesService } from '@/lib/services/api';
import { GeoVisibilityCard } from './GeoVisibilityCard';

// ─── Types ────────────────────────────────────────────────────────────────────

type PrimaryGoal =
  | 'local_leads'
  | 'ecommerce_sales'
  | 'topic_authority'
  | 'multi_location'
  | 'geo_citations'
  | 'organic_growth';

interface SitePage {
  id: number;
  title: string;
  url: string;
  page_type?: string;
}

interface SiteGoals {
  exists: boolean;
  primary_goal: PrimaryGoal | null;
  priority_services: string[];
  priority_locations: Array<{ city: string; state: string; rank?: number }>;
  geo_priority_pages: number[];
  updated_at?: string;
}

interface GoalsTabProps {
  siteId: number | string;
}

// ─── Goal Options ─────────────────────────────────────────────────────────────

const GOAL_OPTIONS: Array<{
  value: PrimaryGoal;
  label: string;
  description: string;
  icon: string;
  showLocations: boolean;
}> = [
  {
    value: 'local_leads',
    label: 'More Local Leads',
    description: 'Get more phone calls, form fills, and walk-ins from nearby customers',
    icon: '📍',
    showLocations: true,
  },
  {
    value: 'ecommerce_sales',
    label: 'E-Commerce Sales',
    description: 'Drive more product purchases and revenue from online shoppers',
    icon: '🛒',
    showLocations: false,
  },
  {
    value: 'topic_authority',
    label: 'Topic Authority',
    description: 'Become the go-to expert source in your industry or niche',
    icon: '🏆',
    showLocations: false,
  },
  {
    value: 'multi_location',
    label: 'Multi-Location Growth',
    description: 'Expand visibility across multiple cities or service areas',
    icon: '🗺️',
    showLocations: true,
  },
  {
    value: 'geo_citations',
    label: 'AI Search Citations',
    description: 'Get cited by ChatGPT, Gemini, and Perplexity when people ask about your services',
    icon: '🤖',
    showLocations: false,
  },
  {
    value: 'organic_growth',
    label: 'Overall Organic Growth',
    description: 'Improve rankings broadly across all pages and keywords',
    icon: '📈',
    showLocations: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyLocations(count = 5) {
  return Array.from({ length: count }, (_, i) => ({ city: '', state: '', rank: i + 1 }));
}

function emptyServices(count = 5) {
  return Array.from({ length: count }, () => '');
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GoalsTab({ siteId }: GoalsTabProps) {
  // Form state
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>(null);
  const [services, setServices] = useState<string[]>(emptyServices());
  const [locations, setLocations] = useState(emptyLocations());
  const [geoPageIds, setGeoPageIds] = useState<number[]>([]);

  // Supporting data
  const [allPages, setAllPages] = useState<SitePage[]>([]);
  const [pageSearch, setPageSearch] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const selectedGoalOption = GOAL_OPTIONS.find((g) => g.value === primaryGoal);
  const showLocations = selectedGoalOption?.showLocations ?? false;

  // ── Load existing goals + pages ──────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [goalsData, pagesData] = await Promise.all([
        goalsService.get(Number(siteId)),
        pagesService.list(Number(siteId)),
      ]);

      if (goalsData && goalsData.primary_goal) {
        setPrimaryGoal(goalsData.primary_goal);
      }

      if (goalsData?.priority_services?.length) {
        const filled = [...goalsData.priority_services];
        while (filled.length < 5) filled.push('');
        setServices(filled.slice(0, 5));
      }

      if (goalsData?.priority_locations?.length) {
        const filled = [...goalsData.priority_locations];
        while (filled.length < 5) filled.push({ city: '', state: '', rank: filled.length + 1 });
        setLocations(filled.slice(0, 5));
      }

      if (goalsData?.geo_priority_pages?.length) {
        setGeoPageIds(goalsData.geo_priority_pages);
      }

      if (Array.isArray(pagesData)) {
        setAllPages(pagesData);
      }
    } catch (err) {
      setFetchError('Failed to load goals. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!primaryGoal) {
      setError('Please select a primary goal before saving.');
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);

    const payload = {
      primary_goal: primaryGoal,
      priority_services: services.filter(Boolean),
      priority_locations: showLocations
        ? locations.filter((l) => l.city.trim())
        : [],
      geo_priority_pages: geoPageIds,
    };

    try {
      await goalsService.save(Number(siteId), payload as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to save goals. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Service helpers ───────────────────────────────────────────────────────

  const updateService = (idx: number, val: string) => {
    const next = [...services];
    next[idx] = val;
    setServices(next);
  };

  // ── Location helpers ──────────────────────────────────────────────────────

  const updateLocation = (idx: number, field: 'city' | 'state', val: string) => {
    const next = [...locations];
    next[idx] = { ...next[idx], [field]: val };
    setLocations(next);
  };

  // ── GEO page helpers ──────────────────────────────────────────────────────

  const toggleGeoPage = (pageId: number) => {
    setGeoPageIds((prev) => {
      if (prev.includes(pageId)) return prev.filter((id) => id !== pageId);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, pageId];
    });
  };

  const filteredPages = allPages.filter(
    (p) =>
      !pageSearch ||
      p.title.toLowerCase().includes(pageSearch.toLowerCase()) ||
      p.url.toLowerCase().includes(pageSearch.toLowerCase())
  );

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading your goals...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-3">{fetchError}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-8 py-8 px-4">

      {/* ── Left: form ── */}
      <div className="flex-1 min-w-0 space-y-10">

        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">Site Goals</h2>
          <p className="mt-1 text-sm text-gray-500">
            Tell Siloq what success looks like for your business. Every recommendation
            will be weighted toward your stated priorities.
          </p>
        </div>

        {/* ── Section 1: Primary Goal ── */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
            1 — What's your #1 goal?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GOAL_OPTIONS.map((opt) => {
              const isSelected = primaryGoal === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPrimaryGoal(opt.value)}
                  className={`
                    relative text-left p-4 rounded-xl border-2 transition-all duration-150
                    ${isSelected
                      ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50'
                    }
                  `}
                >
                  {isSelected && (
                    <span className="absolute top-3 right-3 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                  <div className="text-2xl mb-2">{opt.icon}</div>
                  <div className={`font-semibold text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-800'}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {opt.description}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Section 2: Priority Services ── */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-1">
            2 — Your top services or products
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Siloq will prioritize these in gap analysis and content recommendations.
            List your most revenue-generating offerings first.
          </p>
          <div className="space-y-2">
            {services.map((svc, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-5 h-5 flex-shrink-0 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={svc}
                  onChange={(e) => updateService(idx, e.target.value)}
                  placeholder={
                    idx === 0
                      ? 'e.g. Panel Upgrades'
                      : idx === 1
                      ? 'e.g. EV Charger Installation'
                      : `Service ${idx + 1} (optional)`
                  }
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-300"
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3: Priority Locations (conditional) ── */}
        {showLocations && (
          <section>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-1">
              3 — Priority cities
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Rank the cities where ranking improvements would most impact your revenue.
              #1 gets the most weight in gap analysis.
            </p>
            <div className="space-y-2">
              {locations.map((loc, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-5 h-5 flex-shrink-0 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={loc.city}
                    onChange={(e) => updateLocation(idx, 'city', e.target.value)}
                    placeholder="City"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-300"
                  />
                  <input
                    type="text"
                    value={loc.state}
                    onChange={(e) => updateLocation(idx, 'state', e.target.value.slice(0, 2).toUpperCase())}
                    placeholder="ST"
                    maxLength={2}
                    className="w-16 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-300 text-center uppercase"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Section 4: GEO Priority Pages ── */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-1">
            {showLocations ? '4' : '3'} — AI priority pages
          </h3>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            <span className="font-medium text-gray-700">Which 3 pages do you most want AI assistants like ChatGPT to cite?</span>
            {' '}Siloq will optimize these pages for AI citation signals — schema, FAQ structure, and entity clarity.
          </p>

          {/* Selected pills */}
          {geoPageIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {geoPageIds.map((id) => {
                const page = allPages.find((p) => p.id === id);
                if (!page) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    {page.title.length > 40 ? page.title.slice(0, 40) + '…' : page.title}
                    <button
                      type="button"
                      onClick={() => toggleGeoPage(id)}
                      className="ml-1 text-indigo-400 hover:text-indigo-700"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {geoPageIds.length < 3 && (
            <>
              {/* Search */}
              <div className="relative mb-2">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  placeholder="Search your pages…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Page list */}
              <div className="max-h-52 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 bg-white">
                {filteredPages.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">
                    {allPages.length === 0
                      ? 'No pages synced yet. Run a sync first.'
                      : 'No pages match your search.'}
                  </div>
                ) : (
                  filteredPages.slice(0, 50).map((page) => {
                    const isSelected = geoPageIds.includes(page.id);
                    return (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => toggleGeoPage(page.id)}
                        disabled={!isSelected && geoPageIds.length >= 3}
                        className={`
                          w-full text-left px-4 py-3 flex items-center gap-3 transition-colors
                          ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}
                          ${!isSelected && geoPageIds.length >= 3 ? 'opacity-40 cursor-not-allowed' : ''}
                        `}
                      >
                        <span
                          className={`
                            w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center
                            ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}
                          `}
                        >
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">
                            {page.title || 'Untitled'}
                          </div>
                          <div className="text-xs text-gray-400 truncate">{page.url}</div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {geoPageIds.length}/3 pages selected
              </p>
            </>
          )}
        </section>

        {/* ── Save bar ── */}
        <div className="sticky bottom-0 -mx-4 px-4 pb-4 pt-3 bg-white border-t border-gray-100">
          {error && (
            <p className="text-xs text-red-600 mb-2">{error}</p>
          )}
          <div className="flex items-center justify-between">
            {saved ? (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Goals saved — recommendations updated
              </span>
            ) : (
              <span className="text-xs text-gray-400">
                {primaryGoal ? `Goal: ${selectedGoalOption?.label}` : 'Select a goal to get started'}
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !primaryGoal}
              className={`
                px-5 py-2.5 rounded-lg text-sm font-semibold transition-all
                ${saving || !primaryGoal
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md active:scale-95'
                }
              `}
            >
              {saving ? 'Saving…' : 'Save Goals'}
            </button>
          </div>
        </div>

      </div>

      {/* ── Right: summary panel ── */}
      <div className="w-80 xl:w-96 flex-shrink-0">
        <div className="sticky top-6 space-y-3">
          <GeoVisibilityCard
            siteId={siteId}
            geoPageIds={geoPageIds}
            allPages={allPages}
            goalsLoading={loading}
          />

          {/* Goal summary card */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mt-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Your Goal Summary</h4>
            {primaryGoal ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{selectedGoalOption!.icon}</span>
                  <span className="text-sm font-semibold text-gray-800">{selectedGoalOption!.label}</span>
                </div>
                {services.filter(Boolean).length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-400 mb-1">Priority services</div>
                    {services.filter(Boolean).map((s, i) => (
                      <div key={i} className="text-xs text-gray-600 flex items-center gap-1.5 py-0.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                        {s}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                  Siloq will weight all gap analysis and content recommendations toward these priorities.
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-400">Select a goal above to see your summary.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
