'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { useDashboardContext } from '@/lib/hooks/dashboard-context';
import { silosV2Service, type SiloHealthResponse } from '@/lib/services/api';

function getScoreColor(score: number): string {
  if (score >= 80) return '#27AE60';
  if (score >= 60) return '#D4A017';
  if (score >= 40) return '#F5A623';
  return '#DC2626';
}

function getScoreLabel(score: number, conflictCount: number): string {
  if (score === 100)
    return '🟢 No competing pages detected. Your site structure looks clean!';
  if (score >= 80)
    return `🟢 Minor issues detected. ${conflictCount} low-severity conflicts.`;
  if (score >= 60)
    return `🟡 Moderate issues. ${conflictCount} conflicts need attention.`;
  if (score >= 40)
    return `🟠 Significant cannibalization detected. ${conflictCount} conflicts impacting rankings.`;
  return `🔴 Critical. ${conflictCount} conflicts are actively hurting your search performance.`;
}

export default function SiloHealth() {
  const { selectedSite } = useDashboardContext();
  const [silos, setSilos] = useState<SiloHealthResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!selectedSite) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await silosV2Service.list(selectedSite.id);
      setSilos(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load silo health');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Calculating content health scores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-8 w-8 text-amber-500 mb-4" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-4" onClick={load}>Retry</Button>
      </div>
    );
  }

  if (silos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-4xl mb-4">📊</span>
        <h3 className="text-lg font-semibold mb-2">No silos configured yet</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Silo health scores will appear once your site structure is analyzed.
        </p>
      </div>
    );
  }

  // Overall score
  const overallScore = silos.length > 0
    ? Math.round(silos.reduce((s, si) => s + si.health_score, 0) / silos.length)
    : 0;
  const totalConflicts = silos.reduce((s, si) => s + si.conflict_count, 0);

  return (
    <div className="space-y-6">
      {/* Overall score */}
      <Card className="p-6">
        <div className="flex items-center gap-6">
          <div className="relative h-20 w-20 shrink-0">
            <svg viewBox="0 0 100 100" className="-rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                stroke={getScoreColor(overallScore)}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${overallScore * 2.83} 283`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums">{overallScore}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-1">Silo Health: {overallScore}</h2>
            <p className="text-sm text-muted-foreground">
              {getScoreLabel(overallScore, totalConflicts)}
            </p>
            {overallScore < 40 && (
              <Button size="sm" variant="outline" className="mt-2">Review Plan →</Button>
            )}
          </div>
        </div>
      </Card>

      {/* Per-silo cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {silos.map((silo) => (
          <Card key={silo.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold truncate">{silo.name}</h3>
              <span
                className="text-lg font-bold tabular-nums"
                style={{ color: getScoreColor(silo.health_score) }}
              >
                {silo.health_score}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${silo.health_score}%`,
                  backgroundColor: getScoreColor(silo.health_score),
                }}
              />
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{silo.page_count} pages</span>
              <span>{silo.keyword_count} keywords</span>
              {silo.conflict_count > 0 && (
                <span className="text-amber-600 font-medium">{silo.conflict_count} conflicts</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
