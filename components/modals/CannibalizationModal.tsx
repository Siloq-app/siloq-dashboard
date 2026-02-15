'use client';

import { useState } from 'react';
import { X, AlertTriangle, CheckCircle, ArrowRight, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CompetingPage {
  id: number;
  title: string;
  url: string;
  traffic: number;
}

interface CompetingIssue {
  id: number;
  keyword: string;
  pages: CompetingPage[];
  severity: string;
  recommendation: string;
}

interface Recommendation {
  id: number;
  type: string;
  title: string;
  description: string;
  impact: string;
  effort: string;
}

interface AnalysisResults {
  issuesFound: number;
  totalKeywords: number;
  competingPages: CompetingIssue[];
  recommendations: Recommendation[];
}

interface CannibalizationModalProps {
  pageIds: number[];
  onClose: () => void;
  analysisResults?: AnalysisResults | null;
}

export default function CannibalizationModal({ pageIds, onClose, analysisResults }: CannibalizationModalProps) {
  const [step, setStep] = useState<'analyzing' | 'results' | 'recommendations'>(
    analysisResults ? 'results' : 'analyzing'
  );
  const [selectedRecommendation, setSelectedRecommendation] = useState<number | null>(null);

  // If no results provided and we're "analyzing", stay in that state
  // In a real implementation, this would trigger an API call
  useState(() => {
    if (!analysisResults) {
      const timer = setTimeout(() => {
        // Without real data, just show empty results
        setStep('results');
      }, 2000);
      return () => clearTimeout(timer);
    }
  });

  const handleApprove = (recId: number) => {
    setSelectedRecommendation(recId);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const hasResults = analysisResults && analysisResults.competingPages.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <Sparkles className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Cannibalization Analysis
              </h2>
              <p className="text-sm text-slate-500">
                Analyzing {pageIds.length} selected pages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        {step === 'analyzing' && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
            <p className="text-lg font-medium text-slate-900">Analyzing pages...</p>
            <p className="text-sm text-slate-500">
              Checking for keyword cannibalization and content overlap
            </p>
          </div>
        )}

        {step === 'results' && !hasResults && (
          <div className="py-12 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
            <p className="text-lg font-medium text-slate-900 dark:text-slate-100">No competing pages detected</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              The selected pages don&apos;t appear to be competing for the same keywords.
            </p>
            <div className="mt-6">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}

        {step === 'results' && hasResults && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-red-600" />
                  <p className="text-2xl font-bold text-red-700">
                    {analysisResults!.issuesFound}
                  </p>
                  <p className="text-xs text-red-600">Issues Found</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 text-center">
                  <Target className="mx-auto mb-2 h-6 w-6 text-amber-600" />
                  <p className="text-2xl font-bold text-amber-700">
                    {analysisResults!.totalKeywords}
                  </p>
                  <p className="text-xs text-amber-600">Competing Keywords</p>
                </CardContent>
              </Card>
              <Card className="bg-indigo-50 border-indigo-200">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="mx-auto mb-2 h-6 w-6 text-indigo-600" />
                  <p className="text-2xl font-bold text-indigo-700">
                    {analysisResults!.recommendations.length}
                  </p>
                  <p className="text-xs text-indigo-600">Recommendations</p>
                </CardContent>
              </Card>
            </div>

            {/* Competing Pages */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Competing Pages by Keyword
              </h3>
              <div className="space-y-3">
                {analysisResults!.competingPages.map((issue) => (
                  <Card key={issue.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={issue.severity === 'high' ? 'destructive' : 'default'}
                          >
                            {issue.severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium text-slate-900">
                            &ldquo;{issue.keyword}&rdquo;
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {issue.pages.length} pages competing
                        </span>
                      </div>
                      <div className="space-y-2">
                        {issue.pages.map((page) => (
                          <div
                            key={page.id}
                            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                          >
                            <span className="text-slate-700">{page.title}</span>
                            <span className="text-slate-500">
                              {page.traffic} visits/mo
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        <span className="font-medium">Recommendation:</span>{' '}
                        {issue.recommendation}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {analysisResults!.recommendations.length > 0 && (
                <Button onClick={() => setStep('recommendations')}>
                  View Recommendations
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 'recommendations' && hasResults && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Recommended Actions
            </h3>
            <div className="space-y-3">
              {analysisResults!.recommendations.map((rec) => (
                <Card
                  key={rec.id}
                  className={`overflow-hidden transition-colors ${
                    selectedRecommendation === rec.id
                      ? 'ring-2 ring-indigo-500'
                      : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <Badge
                            variant={
                              rec.impact === 'High' ? 'destructive' : 'default'
                            }
                          >
                            {rec.impact} Impact
                          </Badge>
                          <Badge variant="outline">{rec.effort} Effort</Badge>
                        </div>
                        <h4 className="font-medium text-slate-900">{rec.title}</h4>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(rec.id)}
                        disabled={selectedRecommendation !== null}
                      >
                        {selectedRecommendation === rec.id ? (
                          <>
                            <CheckCircle size={16} className="mr-1" />
                            Approved
                          </>
                        ) : (
                          'Approve & Generate'
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-slate-600">{rec.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setStep('results')}>
                Back to Results
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
