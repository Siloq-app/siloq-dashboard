'use client';

import { useState, useEffect, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DetectedSchema {
  type: string;
  confidence: number;
  reason: string;
  json_ld: Record<string, unknown>;
}

interface PageSchemaInfo {
  post_id: number;
  page_title: string;
  page_url: string;
  role: string;
  detected_schemas: DetectedSchema[];
  existing_external_schema: string[];
  siloq_active_schema: ActiveSchema[];
}

interface ActiveSchema {
  id: number;
  schema_type: string;
  validation_status: string;
  is_active: boolean;
  confidence: number;
}

interface SchemaArchitectProps {
  siteId: number;
  apiBase?: string;
  wpApiBase?: string;
  wpApiKey?: string;
}

const SCHEMA_META: Record<string, { icon: string; label: string; desc: string }> = {
  LocalBusiness:  { icon: '🏢', label: 'Local Business',  desc: 'Business entity, address, hours' },
  Service:        { icon: '⚙️', label: 'Service',          desc: 'Individual service offering' },
  FAQPage:        { icon: '❓', label: 'FAQ Page',          desc: 'Q&A rich results' },
  Article:        { icon: '📝', label: 'Article',           desc: 'Blog posts and news' },
  HowTo:          { icon: '📋', label: 'How To',            desc: 'Step-by-step guides' },
  BreadcrumbList: { icon: '🔗', label: 'Breadcrumb',        desc: 'Navigation path' },
  Organization:   { icon: '🏛️', label: 'Organization',      desc: 'Company identity' },
  Product:        { icon: '🛍️', label: 'Product',           desc: 'E-commerce product' },
  Event:          { icon: '📅', label: 'Event',             desc: 'Events and workshops' },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ConfidenceBadge({ value }: { value: number }) {
  const color = value >= 90 ? '#4ADE80' : value >= 75 ? '#E8D48B' : '#F59E0B';
  return (
    <span style={{
      background: `${color}22`, color, padding: '2px 8px',
      borderRadius: 4, fontSize: 11, fontWeight: 700
    }}>{value}%</span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    valid:      { color: '#4ADE80', label: '✓ Valid' },
    warning:    { color: '#F59E0B', label: '! Warning' },
    invalid:    { color: '#EF4444', label: '✕ Invalid' },
    pending:    { color: '#94A3B8', label: '○ Pending' },
    validating: { color: '#3B82F6', label: '◌ Validating' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ color: s.color, fontSize: 11, fontWeight: 600 }}>{s.label}</span>
  );
}

function JsonPreview({ data }: { data: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const json = JSON.stringify(data, null, 2);
  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'transparent', border: '1px solid #2A2A4A',
          color: '#94A3B8', padding: '3px 12px', borderRadius: 4,
          fontSize: 11, cursor: 'pointer'
        }}
      >
        {expanded ? 'Hide JSON-LD' : 'Preview JSON-LD'}
      </button>
      {expanded && (
        <pre style={{
          background: '#0D0D1A', padding: 12, borderRadius: 6,
          fontSize: 11, color: '#94A3B8', overflowX: 'auto',
          maxHeight: 260, marginTop: 8, border: '1px solid #2A2A4A'
        }}>
          {json}
        </pre>
      )}
    </div>
  );
}

// ── Page Schema View ──────────────────────────────────────────────────────────

function PageSchemaView({
  info,
  wpApiBase,
  wpApiKey,
  onBack,
}: {
  info: PageSchemaInfo;
  wpApiBase: string;
  wpApiKey: string;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(info.detected_schemas.map(d => d.type))
  );
  const [injecting, setInjecting] = useState(false);
  const [injected, setInjected]   = useState(false);
  const [error, setError]         = useState('');

  const toggle = (type: string) => {
    if (type === 'BreadcrumbList') return; // Always include
    setSelected(prev => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const inject = async () => {
    setInjecting(true);
    setError('');
    try {
      const schemas = info.detected_schemas
        .filter(d => selected.has(d.type))
        .map(d => ({ type: d.type, json_ld: d.json_ld, confidence: d.confidence, reason: d.reason }));

      const res = await fetch(`${wpApiBase}/wp-json/siloq/v1/schema/${info.post_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Siloq-Key': wpApiKey },
        body: JSON.stringify(schemas),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Injection failed');
      setInjected(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: '1px solid #2A2A4A', color: '#94A3B8',
            borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12
          }}
        >← Back</button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#F8F8F8', fontWeight: 600 }}>{info.page_title}</span>
            <span style={{
              background: info.role === 'hub' ? '#E8D48B22' : '#3B82F618',
              color: info.role === 'hub' ? '#E8D48B' : '#3B82F6',
              padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700
            }}>{info.role?.toUpperCase()}</span>
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{info.page_url}</div>
        </div>
      </div>

      {info.existing_external_schema.length > 0 && (
        <div style={{
          padding: 12, borderRadius: 8, marginBottom: 16,
          background: '#F59E0B12', border: '1px solid #F59E0B30'
        }}>
          <div style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600, marginBottom: 4 }}>
            ⚠️ Existing Schema Detected
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>
            Types already on this page: {info.existing_external_schema.join(', ')}.
            Siloq injects alongside — configure conflict mode in Settings to override.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ color: '#F8F8F8', fontSize: 13, fontWeight: 600 }}>
            Detected Schema Types ({info.detected_schemas.length})
          </span>
          <span style={{ fontSize: 11, color: '#64748B' }}>BreadcrumbList always included</span>
        </div>

        {info.detected_schemas.map(d => {
          const meta = SCHEMA_META[d.type] || { icon: '📄', label: d.type, desc: '' };
          const isSel = selected.has(d.type);
          return (
            <div
              key={d.type}
              onClick={() => toggle(d.type)}
              style={{
                border: `1px solid ${isSel ? '#E8D48B' : '#2A2A4A'}`,
                borderRadius: 8, padding: 14, cursor: d.type === 'BreadcrumbList' ? 'default' : 'pointer',
                background: isSel ? '#E8D48B08' : 'transparent', transition: 'all 0.15s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: isSel ? '#E8D48B20' : '#2A2A4A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0
                  }}>{meta.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#F8F8F8' }}>{meta.label}</span>
                      <ConfidenceBadge value={d.confidence} />
                      {d.type === 'BreadcrumbList' && (
                        <span style={{ fontSize: 10, color: '#475569', fontStyle: 'italic' }}>auto-included</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>{d.reason}</div>
                    <JsonPreview data={d.json_ld} />
                  </div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${isSel ? '#E8D48B' : '#475569'}`,
                  background: isSel ? '#E8D48B' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s'
                }}>
                  {isSel && <span style={{ color: '#1A1A2E', fontSize: 13, fontWeight: 700 }}>✓</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {injected ? (
        <div style={{
          padding: 16, background: '#4ADE8008', borderRadius: 8,
          border: '1px solid #4ADE8030', textAlign: 'center'
        }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
          <div style={{ fontSize: 14, color: '#4ADE80', fontWeight: 600 }}>Schema Injected</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
            {selected.size} types live in page source via wp_head
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={inject}
            disabled={injecting || selected.size === 0}
            style={{
              width: '100%', padding: '12px 20px', borderRadius: 8, border: 'none',
              cursor: injecting ? 'wait' : 'pointer',
              background: 'linear-gradient(135deg, #E8D48B, #C8A951)',
              color: '#1A1A2E', fontWeight: 700, fontSize: 14,
              opacity: injecting ? 0.7 : 1
            }}
          >
            {injecting ? 'Injecting...' : `Validate & Inject ${selected.size} Schema Types →`}
          </button>
          {error && (
            <div style={{ color: '#EF4444', fontSize: 12, marginTop: 8, padding: '8px 12px', background: '#EF444412', borderRadius: 6 }}>
              {error}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#475569', marginTop: 6, textAlign: 'center' }}>
            Saves to wp_siloq_schema → injects JSON-LD into page source via wp_head
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SchemaArchitect({ siteId, apiBase = '', wpApiBase = '', wpApiKey = '' }: SchemaArchitectProps) {
  const [pages, setPages]         = useState<PageSchemaInfo[]>([]);
  const [selected, setSelected]   = useState<PageSchemaInfo | null>(null);
  const [loading, setLoading]     = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [error, setError]         = useState('');
  const [tab, setTab]             = useState<'auto' | 'settings'>('auto');

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      // Pull pages list from Siloq API
      const res  = await fetch(`${apiBase}/api/v1/sites/${siteId}/pages/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('siloq_token')}` }
      });
      if (!res.ok) throw new Error('Failed to load pages');
      const data = await res.json();
      const pageList = data.pages || data.results || [];

      // For each page, detect schema from WP plugin
      const enriched: PageSchemaInfo[] = await Promise.all(
        pageList.slice(0, 30).map(async (p: { wp_post_id?: number; post_id?: number; url?: string; title?: string; page_type?: string }) => {
          const postId = p.wp_post_id || p.post_id;
          if (!postId) return null;
          try {
            const dr = await fetch(`${wpApiBase}/wp-json/siloq/v1/schema/detect/${postId}`, {
              method: 'POST',
              headers: { 'X-Siloq-Key': wpApiKey }
            });
            if (!dr.ok) return null;
            return await dr.json();
          } catch { return null; }
        })
      );

      setPages(enriched.filter(Boolean) as PageSchemaInfo[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading pages');
    } finally {
      setLoading(false);
    }
  }, [siteId, apiBase, wpApiBase, wpApiKey]);

  useEffect(() => { loadPages(); }, [loadPages]);

  const totalDetected = pages.reduce((s, p) => s + p.detected_schemas.length, 0);
  const hasExisting   = pages.filter(p => p.existing_external_schema.length > 0).length;
  const activeCount   = pages.reduce((s, p) => s + p.siloq_active_schema.length, 0);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>🧩</div>
        Scanning pages for schema opportunities...
      </div>
    );
  }

  if (selected) {
    return (
      <PageSchemaView
        info={selected}
        wpApiBase={wpApiBase}
        wpApiKey={wpApiKey}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderRadius: 8, marginBottom: 20,
        background: 'linear-gradient(135deg, #E8D48B08, #E8D48B04)',
        border: '1px solid #E8D48B20'
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20 }}>🎯</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#E8D48B', marginBottom: 4 }}>
              Schema Architect — Intelligent Structured Data
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5 }}>
              Auto-detects schema types from Hub &amp; Spoke architecture, generates JSON-LD from
              page content + GBP data, and injects directly into page source. No SEO plugin required.
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {(['auto', 'settings'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: tab === t ? '#2A2A4A' : 'transparent',
              border: `1px solid ${tab === t ? '#E8D48B40' : 'transparent'}`,
              color: tab === t ? '#E8D48B' : '#94A3B8',
              padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer'
            }}
          >
            {t === 'auto' ? '🎯 Auto-Detect' : '⚙️ Settings'}
          </button>
        ))}
      </div>

      {tab === 'auto' && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { l: 'Pages Scanned',    v: pages.length,   i: '📄' },
              { l: 'Schemas Detected', v: totalDetected,  i: '🧩' },
              { l: 'Existing Schema',  v: hasExisting,    i: '⚠️' },
              { l: 'Live (Siloq)',     v: activeCount,    i: '✅' },
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
                <div style={{ fontSize: 24, fontWeight: 700, color: '#F8F8F8' }}>{s.v}</div>
              </div>
            ))}
          </div>

          {error && (
            <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12, padding: '8px 12px', background: '#EF444412', borderRadius: 6 }}>
              {error}
            </div>
          )}

          {/* Page list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pages.map(p => (
              <div
                key={p.post_id}
                onClick={() => setSelected(p)}
                style={{
                  display: 'flex', alignItems: 'center', padding: 14,
                  borderRadius: 8, cursor: 'pointer', background: '#252542',
                  border: '1px solid transparent', transition: 'all 0.15s'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#E8D48B40';
                  (e.currentTarget as HTMLDivElement).style.background = '#2A2A4A';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent';
                  (e.currentTarget as HTMLDivElement).style.background = '#252542';
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: '#F8F8F8', fontSize: 14, fontWeight: 500 }}>{p.page_title}</span>
                    <span style={{
                      background: p.role === 'hub' ? '#E8D48B22' : '#3B82F618',
                      color: p.role === 'hub' ? '#E8D48B' : '#3B82F6',
                      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700
                    }}>{p.role?.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{p.page_url}</div>
                </div>
                <div style={{ display: 'flex', gap: 4, marginRight: 12, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 280 }}>
                  {p.detected_schemas.map(d => {
                    const m = SCHEMA_META[d.type] || { icon: '📄', label: d.type, desc: '' };
                    return (
                      <span key={d.type} style={{
                        background: '#1A1A2E', padding: '3px 8px', borderRadius: 4,
                        fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 3
                      }}>
                        <span>{m.icon}</span>
                        <span>{m.label}</span>
                        <ConfidenceBadge value={d.confidence} />
                      </span>
                    );
                  })}
                </div>
                {p.existing_external_schema.length > 0 && (
                  <span style={{ fontSize: 11, color: '#F59E0B', whiteSpace: 'nowrap', marginRight: 8 }}>⚠️ Has Schema</span>
                )}
                {p.siloq_active_schema.length > 0 && (
                  <span style={{ fontSize: 11, color: '#4ADE80', whiteSpace: 'nowrap', marginRight: 8 }}>✅ Live</span>
                )}
                <span style={{ color: '#64748B', fontSize: 16 }}>→</span>
              </div>
            ))}
          </div>

          {pages.length > 0 && (
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button
                onClick={loadPages}
                style={{
                  padding: '10px 32px', borderRadius: 8, border: '1px solid #2A2A4A',
                  background: 'transparent', color: '#94A3B8', fontSize: 13, cursor: 'pointer'
                }}
              >
                Refresh Scan
              </button>
            </div>
          )}
        </>
      )}

      {tab === 'settings' && (
        <div>
          <h4 style={{ color: '#F8F8F8', fontSize: 14, marginBottom: 16 }}>Schema Settings</h4>
          {[
            { l: 'Auto-include BreadcrumbList on all pages',   d: 'Generated from Hub & Spoke architecture',          on: true },
            { l: 'Auto-include Organization on homepage',       d: 'Adds Organization schema with GBP data',           on: true },
            { l: 'Detect FAQ sections automatically',           d: 'Scans page content for Q&A patterns',              on: true },
            { l: 'Validate before injecting',                   d: 'Checks required fields before saving',             on: true },
            { l: 'Auto-inject on detection (no review)',        d: 'Skip manual confirmation — inject immediately',     on: false },
            { l: 'Override existing third-party schema',        d: 'Disables AIOSEO, Yoast, Rank Math schema output',   on: false },
          ].map((s, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: 14, background: '#252542', borderRadius: 8, border: '1px solid #2A2A4A', marginBottom: 8
            }}>
              <div>
                <div style={{ fontSize: 13, color: '#F8F8F8', fontWeight: 500 }}>{s.l}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{s.d}</div>
              </div>
              <div style={{
                width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
                background: s.on ? '#E8D48B' : '#3A3A5A', position: 'relative', flexShrink: 0
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', background: 'white',
                  position: 'absolute', top: 3, left: s.on ? 21 : 3, transition: 'left 0.2s'
                }} />
              </div>
            </div>
          ))}

          <div style={{ padding: 14, background: '#0D0D1A', borderRadius: 8, border: '1px solid #2A2A4A', marginTop: 8 }}>
            <h5 style={{ color: '#F8F8F8', fontSize: 13, margin: '0 0 10px 0' }}>Injection Details</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { l: 'Storage',            v: 'wp_siloq_schema → wp_head hook' },
                { l: 'Output',             v: '<script type="application/ld+json">' },
                { l: 'Conflict Detection', v: 'Scans AIOSEO, Yoast, Rank Math, themes', c: '#4ADE80' },
                { l: 'Plugin Dependency',  v: 'None — works on any WordPress site',      c: '#E8D48B' },
              ].map((x, i) => (
                <div key={i}>
                  <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>{x.l}</label>
                  <div style={{
                    fontSize: 12, color: x.c || '#F8F8F8', padding: '6px 10px',
                    background: '#2A2A4A', borderRadius: 4,
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    {x.c && <span style={{ width: 6, height: 6, borderRadius: '50%', background: x.c, flexShrink: 0 }} />}
                    {x.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
