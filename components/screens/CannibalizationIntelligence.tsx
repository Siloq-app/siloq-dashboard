'use client';

/**
 * CannibalizationIntelligence
 *
 * Renders the Informational Gain + Geographic Grounding intelligence
 * directly inside the page analysis RecommendationPanel.
 *
 * Uses real API field names (confirmed from geographic_grounding.py):
 *   informational_gain.unique_percentage  (0–100 score)
 *   informational_gain.label              (strong | moderate | weak | none)
 *   informational_gain.unique_ratio
 *   informational_gain.max_similarity_to_hub
 *   informational_gain.swap_pattern_detected
 *   informational_gain.recommendations[]
 *
 *   geographic_grounding.is_location_page
 *   geographic_grounding.target_location
 *   geographic_grounding.grounding_status  (strong | weak | none | unknown)
 *   geographic_grounding.grounding_signals[]
 *   geographic_grounding.missing_signals[]
 *   geographic_grounding.warning_message
 *   geographic_grounding.recommendations[]
 *
 * Spec: Informational Gain + Geographic Grounding UI Spec v1.0
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Types ────────────────────────────────────────────────────────────────────

interface InformationalGain {
  unique_percentage: number;
  unique_ratio: number;
  label: 'strong' | 'moderate' | 'weak' | 'none';
  emoji?: string;
  warning: boolean;
  swap_pattern_detected?: boolean;
  max_similarity_to_hub?: number;
  avg_similarity_to_hub?: number;
  recommendations: string[];
  note?: string;
}

interface GeographicGrounding {
  is_location_page: boolean;
  target_location: string | null;
  grounding_status: 'strong' | 'weak' | 'none' | 'unknown' | null;
  grounding_signals: string[];
  missing_signals: string[];
  warning: boolean;
  warning_message: string | null;
  recommendations: string[];
}

export interface PageAnalysisWithIntelligence {
  informational_gain?: InformationalGain;
  geographic_grounding?: GeographicGrounding;
  // forward-compat — the rest of the analysis object lives here too
  [key: string]: unknown;
}

interface CannibalizationIntelligenceProps {
  analysis: PageAnalysisWithIntelligence;
  onReanalyze?: () => void;
}

// ── Score helpers ─────────────────────────────────────────────────────────────

type ScoreColor = { bg: string; text: string; border: string; badge: string };

function labelToColor(label: string | null | undefined): ScoreColor {
  switch (label) {
    case 'strong': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', badge: 'bg-green-100 text-green-700' };
    case 'moderate': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' };
    case 'weak': return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' };
    case 'none': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 text-red-700' };
    default: return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600' };
  }
}

function statusLabel(label: string | null | undefined): string {
  switch (label) {
    case 'strong': return 'Strong';
    case 'moderate': return 'Moderate';
    case 'weak': return 'Weak';
    case 'none': return 'Critical';
    case 'unknown': return 'Unknown';
    default: return 'Not scored';
  }
}

function similarityBadge(pct: number): string {
  if (pct >= 70) return 'bg-red-100 text-red-700';
  if (pct >= 50) return 'bg-orange-100 text-orange-700';
  return 'bg-yellow-100 text-yellow-700';
}

// ── Signal name → human readable ─────────────────────────────────────────────

const SIGNAL_LABELS: Record<string, string> = {
  gbp_domain_matches: 'GBP listing links to this domain',
  gbp_service_area_covers_location: 'GBP service area covers this city',
  gbp_reviews_mention_location: 'Customer reviews mention this city',
};

function signalLabel(key: string): string {
  return SIGNAL_LABELS[key] || key.replace(/_/g, ' ');
}

// ── Static tip content ────────────────────────────────────────────────────────

const IG_TIPS = [
  'Add a section unique to this city/service that does not appear on any other page.',
  'Include a customer testimonial from someone in this specific area.',
  'Reference a local project, job site, or area-specific scenario.',
  'Cover a service angle or problem type that differs from your other pages.',
  'Review your other similar pages and consciously differentiate each one\'s opening paragraph.',
];

const GG_TIPS = [
  'Add the target city\'s zip codes naturally in the content (e.g., "serving the 64118 and 64119 zip codes").',
  'Reference a well-known local landmark, neighborhood, or road.',
  'Mention a city-specific fact — population, local event, or area history.',
  'Add a customer story or review that mentions the city by name.',
  'Include the city name in at least one H2 or H3 heading on the page.',
  'If you have photos from a local job, add alt text referencing the city.',
];

// ── Collapsible panel ─────────────────────────────────────────────────────────

function Panel({
  title,
  score,
  label,
  defaultOpen,
  children,
}: {
  title: string;
  score: number;
  label: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const colors = labelToColor(label);

  return (
    <div className={`rounded-lg border ${colors.border} overflow-hidden`}>
      <button
        className={`w-full flex items-center justify-between px-4 py-3 ${colors.bg} hover:opacity-90 transition-opacity`}
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">{title}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
            {score}/100
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
            {statusLabel(label)}
          </span>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && <div className="px-4 py-3 bg-white border-t border-slate-100">{children}</div>}
    </div>
  );
}

// ── Tips expander ─────────────────────────────────────────────────────────────

function TipsPanel({ tips }: { tips: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
        onClick={() => setOpen(o => !o)}
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        How to fix this
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5 pl-1">
          {tips.map((tip, i) => (
            <li key={i} className="flex gap-2 text-xs text-slate-600">
              <span className="text-blue-400 flex-shrink-0 mt-0.5">→</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CannibalizationIntelligence({
  analysis,
  onReanalyze,
}: CannibalizationIntelligenceProps) {
  const ig = analysis?.informational_gain as InformationalGain | undefined;
  const gg = analysis?.geographic_grounding as GeographicGrounding | undefined;

  // If neither field present → data was analyzed before these features shipped
  if (!ig && !gg) {
    return (
      <div className="mt-6 border-t border-slate-100 pt-5">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Cannibalization Intelligence</h3>
        </div>
        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100 text-sm text-amber-700">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span>Re-analyze this page to see Cannibalization Intelligence scores.</span>
          {onReanalyze && (
            <Button size="sm" variant="outline" className="ml-auto text-xs h-7" onClick={onReanalyze}>
              Re-analyze
            </Button>
          )}
        </div>
      </div>
    );
  }

  const igScore = ig ? Math.round(ig.unique_percentage) : null;
  const igLabel = ig?.label ?? null;
  const igAutoOpen = !!(ig && (ig.label === 'weak' || ig.label === 'none'));

  const ggPresent = gg?.is_location_page === true;
  const ggStatusLabel = gg?.grounding_status ?? null;
  // Map GG status to numeric score for display (strong=85, weak=35, none=10, unknown=0)
  const ggScore = ggStatusLabel === 'strong' ? 85
    : ggStatusLabel === 'weak' ? 35
    : ggStatusLabel === 'none' ? 10
    : ggStatusLabel === 'unknown' ? 0
    : null;
  const ggAutoOpen = !!(gg && gg.warning);

  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <Zap size={16} className="text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-700">Cannibalization Intelligence</h3>
        <span
          className="text-slate-400 cursor-help text-xs border border-slate-200 rounded-full w-4 h-4 flex items-center justify-center"
          title="Siloq analyzes your entire site to detect where pages are competing against each other."
        >
          ?
        </span>
      </div>

      <div className="space-y-3">

        {/* ── Informational Gain ─────────────────────────────────────────── */}
        {ig && igScore !== null && (
          <Panel
            title="Informational Gain"
            score={igScore}
            label={igLabel ?? 'none'}
            defaultOpen={igAutoOpen}
          >
            {/* Summary */}
            <p className="text-xs text-slate-600 mb-3">
              {ig.recommendations?.[0] || (
                igScore >= 75
                  ? 'This page is well differentiated — low cannibalization risk.'
                  : igScore >= 50
                  ? 'Some content overlap with similar pages. Consider adding more unique content.'
                  : igScore >= 25
                  ? 'Significant content duplication detected. Differentiate this page to avoid cannibalization.'
                  : 'This page appears near-duplicate with other pages on your site. Google may suppress both.'
              )}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 mb-3 text-xs text-slate-500">
              <span>
                <strong className={labelToColor(igLabel).text}>{igScore}%</strong> of content is unique to this page
              </span>
              {ig.max_similarity_to_hub !== undefined && (
                <span>
                  Most similar page:{' '}
                  <span className={`font-medium ${similarityBadge(Math.round(ig.max_similarity_to_hub * 100)).replace('bg-', 'text-').replace('-100', '-700')}`}>
                    {Math.round(ig.max_similarity_to_hub * 100)}% overlap
                  </span>
                </span>
              )}
              {ig.swap_pattern_detected && (
                <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                  <AlertTriangle size={11} /> City-page template detected
                </span>
              )}
            </div>

            {/* Additional recommendations */}
            {ig.recommendations && ig.recommendations.length > 1 && (
              <ul className="space-y-1 mb-3">
                {ig.recommendations.slice(1).map((rec, i) => (
                  <li key={i} className="text-xs text-slate-500 flex gap-1.5">
                    <span className="text-slate-300 flex-shrink-0">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            )}

            <TipsPanel tips={IG_TIPS} />
          </Panel>
        )}

        {/* ── Geographic Grounding ───────────────────────────────────────── */}
        {ggPresent && gg && ggScore !== null && (
          <Panel
            title={`Geographic Grounding${gg.target_location ? ` — ${gg.target_location}` : ''}`}
            score={ggScore}
            label={ggStatusLabel ?? 'none'}
            defaultOpen={ggAutoOpen}
          >
            {/* Summary message */}
            {gg.warning_message && (
              <p className="text-xs text-slate-600 mb-3">{gg.warning_message}</p>
            )}

            {/* Signals found */}
            {gg.grounding_signals && gg.grounding_signals.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-medium text-slate-500 mb-1">Grounding signals found:</p>
                <ul className="space-y-1">
                  {gg.grounding_signals.map(signal => (
                    <li key={signal} className="flex items-center gap-2 text-xs text-green-700">
                      <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                      {signalLabel(signal)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Signals missing */}
            {gg.missing_signals && gg.missing_signals.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-medium text-slate-500 mb-1">Missing signals:</p>
                <ul className="space-y-1">
                  {gg.missing_signals.map(signal => (
                    <li key={signal} className="flex items-center gap-2 text-xs text-red-600">
                      <XCircle size={13} className="text-red-400 flex-shrink-0" />
                      {signalLabel(signal)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {gg.recommendations && gg.recommendations.length > 0 && (
              <ul className="space-y-1 mt-2 mb-1">
                {gg.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-slate-500 flex gap-1.5">
                    <span className="text-slate-300 flex-shrink-0">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            )}

            <TipsPanel tips={GG_TIPS} />
          </Panel>
        )}

        {/* GG not applicable (non-location page) — render nothing */}

      </div>
    </div>
  );
}
