'use client';

import { useState, useEffect, useCallback } from 'react';

interface FreshnessPage {
  page_id: number;
  page_url: string;
  title: string;
  score: number;
  label: string;
  emoji: string;
  warning: boolean;
  components: {
    age: { score: number; days_since_edit: number | null; last_modified: string | null; note: string };
    ctr_trend: { score: number; note: string };
    static_patterns: { score: number; flags: string[] };
  };
  outdated_flags: string[];
  recommendations: string[];
}

interface SiteFreshness {
  site_freshness_score: number;
  total_pages: number;
  stale_pages: number;
  aging_pages: number;
  fresh_pages: number;
  pages: FreshnessPage[];
}

interface FreshnessTabProps {
  siteId: number;
  apiBase?: string;
}

function ScoreBadge({ score, label, emoji }: { score: number; label: string; emoji: string }) {
  const colors: Record<string, string> = {
    Fresh: '#4ADE80', OK: '#4ADE80', Aging: '#E8D48B',
    Stale: '#F59E0B', Outdated: '#EF4444', unknown: '#64748B',
  };
  const color = colors[label] || '#64748B';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span>{emoji}</span>
      <span style={{
        background: `${color}22`, color, padding: '2px 10px',
        borderRadius: 4, fontSize: 11, fontWeight: 700
      }}>{label} {score !== null && score !== undefined ? `(${score})` : ''}</span>
    </div>
  );
}

export default function FreshnessTab({ siteId, apiBase = '' }: FreshnessTabProps) {
  const [data, setData]         = useState<SiteFreshness | null>(null);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/sites/${siteId}/freshness/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('siloq_token')}` }
      });
      if (!res.ok) throw new Error('Failed to load freshness data');
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [siteId, apiBase]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>📅</div>
      Calculating content freshness scores...
    </div>
  );

  if (!data) return (
    <div style={{ color: '#EF4444', padding: 20 }}>{error || 'No data'}</div>
  );

  const siteColor = data.site_freshness_score >= 70 ? '#4ADE80' : data.site_freshness_score >= 50 ? '#E8D48B' : '#EF4444';

  return (
    <div>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderRadius: 8, marginBottom: 20,
        background: 'linear-gradient(135deg, #E8D48B08, #E8D48B04)', border: '1px solid #E8D48B20'
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20 }}>📅</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#E8D48B', marginBottom: 4 }}>
              Content Freshness Scoring
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5 }}>
              Google now penalizes static, never-updated content. This scores every page on age,
              CTR trend, and outdated language patterns — and flags exactly what needs updating.
            </div>
          </div>
        </div>
      </div>

      {/* Site-level stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Site Freshness', v: `${data.site_freshness_score}/100`, i: '📊', c: siteColor },
          { l: 'Stale Pages',    v: data.stale_pages,    i: '🔴' },
          { l: 'Aging Pages',    v: data.aging_pages,    i: '🟡' },
          { l: 'Fresh Pages',    v: data.fresh_pages,    i: '✅' },
        ].map(s => (
          <div key={s.l} style={{
            background: '#252542', borderRadius: 8, padding: 14, border: '1px solid #2A2A4A'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>{s.i}</span>
              <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {s.l}
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: (s as { c?: string }).c || '#F8F8F8' }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Page list — most stale first */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.pages.map((page, idx) => (
          <div key={page.page_id || idx} style={{
            background: '#252542', borderRadius: 8, border: '1px solid #2A2A4A', overflow: 'hidden'
          }}>
            <div
              onClick={() => setExpanded(expanded === idx ? null : idx)}
              style={{
                display: 'flex', alignItems: 'center', padding: 14, cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#2A2A4A'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: '#F8F8F8', fontWeight: 500, marginBottom: 2 }}>
                  {page.title || page.page_url}
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{page.page_url}</div>
              </div>
              <div style={{ marginRight: 16 }}>
                <ScoreBadge score={page.score} label={page.label} emoji={page.emoji} />
              </div>
              {page.components?.age?.days_since_edit !== null && (
                <div style={{ fontSize: 11, color: '#64748B', marginRight: 12, whiteSpace: 'nowrap' }}>
                  {page.components.age.days_since_edit}d old
                </div>
              )}
              <span style={{ color: '#64748B', fontSize: 14 }}>
                {expanded === idx ? '▲' : '▼'}
              </span>
            </div>

            {expanded === idx && (
              <div style={{ padding: '0 14px 14px', borderTop: '1px solid #2A2A4A' }}>
                {/* Component scores */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 12, marginBottom: 12 }}>
                  {[
                    { l: 'Age Score',     v: page.components?.age?.score,             n: page.components?.age?.note,             w: '45%' },
                    { l: 'CTR Trend',     v: page.components?.ctr_trend?.score,        n: page.components?.ctr_trend?.note,        w: '35%' },
                    { l: 'Static Patterns', v: page.components?.static_patterns?.score, n: `${page.components?.static_patterns?.flags?.length || 0} flags`, w: '20%' },
                  ].map(c => (
                    <div key={c.l} style={{ background: '#1A1A2E', padding: 10, borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>{c.l} ({c.w})</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#F8F8F8', marginBottom: 2 }}>
                        {c.v ?? '—'}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>{c.n}</div>
                    </div>
                  ))}
                </div>

                {/* Outdated flags */}
                {page.outdated_flags.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600, marginBottom: 6 }}>
                      ⚠️ Outdated Content Flags
                    </div>
                    {page.outdated_flags.map((flag, i) => (
                      <div key={i} style={{
                        fontSize: 12, color: '#94A3B8', padding: '6px 10px',
                        background: '#F59E0B0A', borderRadius: 4, marginBottom: 4, lineHeight: 1.4
                      }}>
                        {flag}
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {page.recommendations.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: '#E8D48B', fontWeight: 600, marginBottom: 6 }}>
                      💡 What To Do
                    </div>
                    {page.recommendations.map((rec, i) => (
                      <div key={i} style={{
                        fontSize: 12, color: '#94A3B8', padding: '6px 10px',
                        background: '#E8D48B08', borderRadius: 4, marginBottom: 4,
                        borderLeft: '2px solid #E8D48B40', lineHeight: 1.5
                      }}>
                        {rec}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
