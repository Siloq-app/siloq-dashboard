'use client';

import React, { useState } from 'react';
import { MockPage, SeoAnalysisResult } from '../types';
import {
  ScanSearch,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Download,
  Wand2,
  Save,
} from 'lucide-react';

interface ScannerViewProps {
  pages: MockPage[];
  setPages: React.Dispatch<React.SetStateAction<MockPage[]>>;
}

// Dummy analysis result for demo
const getDummyAnalysis = (): SeoAnalysisResult => ({
  score: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
  summary:
    'This page effectively communicates value proposition with strong CTAs and clear messaging.',
  keywords: ['business growth', 'digital marketing', 'lead generation', 'conversion optimization'],
  improvements: [
    'Add more specific data points and statistics to build credibility.',
    'Include customer testimonials to increase trust and social proof.',
    'Optimize meta description to include target keywords naturally.',
  ],
  leadGenHook: 'Transform your business today - get a free consultation worth $500!',
});

export function ScannerView({ pages, setPages }: ScannerViewProps) {
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [result, setResult] = useState<SeoAnalysisResult | null>(null);
  const [optimizedContent, setOptimizedContent] = useState<string | null>(null);

  const handleScan = async () => {
    if (!selectedPageId) return;
    setIsAnalyzing(true);
    setResult(null);
    setOptimizedContent(null);
    setLoadingStatus('Initializing scanner...');

    const page = pages.find((p) => p.id.toString() === selectedPageId);
    if (page) {
      // Simulate reading content
      setLoadingStatus('Extracting content structure...');
      await new Promise((r) => setTimeout(r, 800));

      // Simulate AI connection
      setLoadingStatus('Connecting to Gemini AI...');
      await new Promise((r) => setTimeout(r, 600));

      // Get dummy analysis
      const analysis = getDummyAnalysis();

      // Simulate report generation
      setLoadingStatus('Generating improvement strategies...');
      await new Promise((r) => setTimeout(r, 800));

      setResult(analysis);
    }
    setIsAnalyzing(false);
  };

  const handleOptimize = async () => {
    if (!selectedPageId || !result) return;
    setIsOptimizing(true);

    // Simulate AI optimization
    await new Promise((r) => setTimeout(r, 2000));

    const optimized =
      'Discover proven strategies to accelerate your business growth with our expert digital marketing solutions. We help you attract qualified leads, increase conversions, and maximize your ROI through data-driven campaigns tailored to your unique goals. Start your journey to success today!';

    setOptimizedContent(optimized);
    setIsOptimizing(false);
  };

  const handleSaveOptimization = () => {
    if (!selectedPageId || !optimizedContent) return;

    setPages((prev) =>
      prev.map((p) => {
        if (p.id.toString() === selectedPageId) {
          return { ...p, excerpt: optimizedContent };
        }
        return p;
      })
    );

    alert('Content updated successfully!');
    setOptimizedContent(null);
  };

  const handleReset = () => {
    setResult(null);
    setSelectedPageId('');
    setOptimizedContent(null);
  };

  const handleExportCSV = () => {
    if (!result || !selectedPageId) return;

    const page = pages.find((p) => p.id.toString() === selectedPageId);
    const pageTitle = page ? page.title : 'Unknown Page';

    const csvHeader = [
      'Page ID',
      'Page Title',
      'Score',
      'Keywords',
      'Summary',
      'Lead Gen Hook',
      'Improvements',
    ];
    const csvRow = [
      selectedPageId,
      pageTitle,
      result.score,
      result.keywords.join(', '),
      result.summary,
      result.leadGenHook,
      result.improvements.join('; '),
    ];

    const csvContent = [csvHeader.join(','), csvRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `seo-analysis-${pageTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-normal text-gray-800">
          Lead Gen Scanner{' '}
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
            AI BETA
          </span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Analyze your content to maximize conversion rates and SEO performance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Controls Section */}
        <div className="col-span-1 space-y-4">
          <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
            <label htmlFor="page-select" className="mb-2 block text-sm font-semibold text-gray-700">
              Select Page to Audit
            </label>
            <select
              id="page-select"
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              className="mb-4 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
            >
              <option value="">-- Choose a Page --</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.title}
                </option>
              ))}
            </select>

            <button
              onClick={handleScan}
              disabled={!selectedPageId || isAnalyzing}
              className="flex w-full items-center justify-center gap-2 rounded bg-[#2271b1] py-2.5 font-medium text-white transition-colors hover:bg-[#135e96] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> {loadingStatus}
                </>
              ) : (
                <>
                  <ScanSearch size={18} /> Start Analysis
                </>
              )}
            </button>
          </div>

          {selectedPageId && (
            <div className="rounded border border-blue-100 bg-blue-50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-blue-800">Selected Page Preview</h4>
              {(() => {
                const page = pages.find((p) => p.id.toString() === selectedPageId);
                return page ? (
                  <div>
                    <p className="text-sm font-medium text-blue-700">{page.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-blue-600">{page.excerpt}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-blue-500">
                      <span>Status: {page.status}</span>
                      <span>•</span>
                      <span>Author: {page.author}</span>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="col-span-1 lg:col-span-2">
          {isAnalyzing && (
            <div className="animate-pulse space-y-6">
              <div className="flex items-center justify-between rounded border border-gray-200 bg-white p-6 shadow-sm">
                <div className="w-1/2 space-y-2">
                  <div className="h-5 w-48 rounded bg-gray-200"></div>
                  <div className="h-4 w-full rounded bg-gray-100"></div>
                </div>
                <div className="h-20 w-20 rounded-full border-4 border-gray-200 bg-gray-100"></div>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                <h3 className="text-lg font-semibold text-gray-800">Analysis Results</h3>
                <div className="flex w-full items-center gap-3 sm:w-auto">
                  <button
                    onClick={handleExportCSV}
                    className="flex flex-1 items-center justify-center gap-2 rounded border border-[#2271b1] bg-white px-3 py-1.5 text-xs font-medium text-[#2271b1] transition-colors hover:bg-blue-50 sm:flex-none"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 text-sm text-[#2271b1] hover:text-[#135e96] hover:underline"
                  >
                    <RotateCcw size={14} /> Scan Another Page
                  </button>
                </div>
              </div>

              {/* Score Card */}
              <div className="flex items-center justify-between rounded border border-gray-200 bg-white p-6 shadow-sm">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Overall SEO Score</h3>
                  <p className="text-sm text-gray-500">{result.summary}</p>
                </div>
                <div
                  className={`relative flex h-20 w-20 items-center justify-center rounded-full border-4 text-2xl font-bold ${
                    result.score >= 80
                      ? 'border-green-500 bg-green-50 text-green-600'
                      : result.score >= 50
                        ? 'border-amber-500 bg-amber-50 text-amber-600'
                        : 'border-red-500 bg-red-50 text-red-600'
                  }`}
                >
                  {result.score}
                </div>
              </div>

              {/* Improvements */}
              <div className="overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-6 py-3 font-medium text-gray-700">
                  <AlertTriangle size={16} className="text-amber-500" /> Improvement Opportunities
                </div>
                <ul className="divide-y divide-gray-100">
                  {result.improvements.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 px-6 py-4 hover:bg-gray-50">
                      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600">
                        {idx + 1}
                      </div>
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end border-t border-gray-200 bg-gray-50 p-4">
                  <button
                    onClick={handleOptimize}
                    disabled={isOptimizing}
                    className="flex items-center gap-2 rounded bg-[#2271b1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#135e96] disabled:opacity-70"
                  >
                    {isOptimizing ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Wand2 size={16} />
                    )}
                    {isOptimizing ? 'Generating...' : 'Auto-Optimize Content'}
                  </button>
                </div>
              </div>

              {/* Optimization Result */}
              {optimizedContent && (
                <div className="rounded border border-green-200 bg-white shadow-sm ring-4 ring-green-50">
                  <div className="flex items-center justify-between border-b border-green-200 bg-green-50 px-6 py-3 font-medium text-green-800">
                    <span className="flex items-center gap-2">
                      <Sparkles size={16} /> Optimization Result
                    </span>
                    <span className="rounded border border-green-200 bg-white px-2 py-0.5 text-xs text-green-700">
                      AI Generated
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="rounded border border-green-100 bg-green-50/50 p-3 text-sm text-gray-800">
                      {optimizedContent}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
                    <button
                      onClick={() => setOptimizedContent(null)}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Discard
                    </button>
                    <button
                      onClick={handleSaveOptimization}
                      className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      <Save size={16} /> Apply Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Keywords & Hook */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
                  <h4 className="mb-3 flex items-center gap-2 font-medium text-gray-800">
                    <CheckCircle2 size={16} className="text-green-500" /> Suggested Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded bg-gradient-to-br from-[#2271b1] to-[#135e96] p-6 text-white shadow-sm">
                  <h4 className="mb-2 text-sm font-medium uppercase tracking-wider text-blue-100">
                    AI Suggested Hook
                  </h4>
                  <p className="font-serif text-lg italic leading-relaxed opacity-95">
                    &ldquo;{result.leadGenHook}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
