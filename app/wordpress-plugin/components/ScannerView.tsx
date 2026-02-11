'use client';

import React, { useState } from 'react';
import { MockPage, SeoAnalysisResult } from '../types';
import { ScanSearch, Sparkles, AlertTriangle, CheckCircle2, Loader2, RotateCcw, Download, Wand2, Save } from 'lucide-react';

interface ScannerViewProps {
  pages: MockPage[];
  setPages: React.Dispatch<React.SetStateAction<MockPage[]>>;
}

// Dummy analysis result for demo
const getDummyAnalysis = (): SeoAnalysisResult => ({
  score: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
  summary: 'This page effectively communicates value proposition with strong CTAs and clear messaging.',
  keywords: ['business growth', 'digital marketing', 'lead generation', 'conversion optimization'],
  improvements: [
    'Add more specific data points and statistics to build credibility.',
    'Include customer testimonials to increase trust and social proof.',
    'Optimize meta description to include target keywords naturally.'
  ],
  leadGenHook: 'Transform your business today - get a free consultation worth $500!'
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
    setLoadingStatus("Initializing scanner...");

    const page = pages.find(p => p.id.toString() === selectedPageId);
    if (page) {
      // Simulate reading content
      setLoadingStatus("Extracting content structure...");
      await new Promise(r => setTimeout(r, 800));

      // Simulate AI connection
      setLoadingStatus("Connecting to Gemini AI...");
      await new Promise(r => setTimeout(r, 600));

      // Get dummy analysis
      const analysis = getDummyAnalysis();

      // Simulate report generation
      setLoadingStatus("Generating improvement strategies...");
      await new Promise(r => setTimeout(r, 800));

      setResult(analysis);
    }
    setIsAnalyzing(false);
  };

  const handleOptimize = async () => {
    if (!selectedPageId || !result) return;
    setIsOptimizing(true);

    // Simulate AI optimization
    await new Promise(r => setTimeout(r, 2000));

    const optimized = "Discover proven strategies to accelerate your business growth with our expert digital marketing solutions. We help you attract qualified leads, increase conversions, and maximize your ROI through data-driven campaigns tailored to your unique goals. Start your journey to success today!";

    setOptimizedContent(optimized);
    setIsOptimizing(false);
  };

  const handleSaveOptimization = () => {
    if (!selectedPageId || !optimizedContent) return;

    setPages(prev => prev.map(p => {
      if (p.id.toString() === selectedPageId) {
        return { ...p, excerpt: optimizedContent };
      }
      return p;
    }));

    alert("Content updated successfully!");
    setOptimizedContent(null);
  };

  const handleReset = () => {
    setResult(null);
    setSelectedPageId('');
    setOptimizedContent(null);
  };

  const handleExportCSV = () => {
    if (!result || !selectedPageId) return;

    const page = pages.find(p => p.id.toString() === selectedPageId);
    const pageTitle = page ? page.title : 'Unknown Page';

    const csvHeader = ['Page ID', 'Page Title', 'Score', 'Keywords', 'Summary', 'Lead Gen Hook', 'Improvements'];
    const csvRow = [
      selectedPageId,
      pageTitle,
      result.score,
      result.keywords.join(', '),
      result.summary,
      result.leadGenHook,
      result.improvements.join('; ')
    ];

    const csvContent = [csvHeader.join(','), csvRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `seo-analysis-${pageTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-normal text-gray-800 flex items-center gap-2">
          Lead Gen Scanner <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-bold">AI BETA</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">Analyze your content to maximize conversion rates and SEO performance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Section */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
            <label htmlFor="page-select" className="block text-sm font-semibold text-gray-700 mb-2">Select Page to Audit</label>
            <select
              id="page-select"
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-[#2271b1] focus:border-[#2271b1] outline-none mb-4 bg-white"
            >
              <option value="">-- Choose a Page --</option>
              {pages.map(page => (
                <option key={page.id} value={page.id}>{page.title}</option>
              ))}
            </select>

            <button
              onClick={handleScan}
              disabled={!selectedPageId || isAnalyzing}
              className="w-full bg-[#2271b1] hover:bg-[#135e96] text-white font-medium py-2.5 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <><Loader2 className="animate-spin" size={18} /> {loadingStatus}</>
              ) : (
                <><ScanSearch size={18} /> Start Analysis</>
              )}
            </button>
          </div>

          {selectedPageId && (
            <div className="bg-blue-50 p-4 rounded border border-blue-100">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Selected Page Preview</h4>
              {(() => {
                const page = pages.find(p => p.id.toString() === selectedPageId);
                return page ? (
                  <div>
                    <p className="text-sm text-blue-700 font-medium">{page.title}</p>
                    <p className="text-xs text-blue-600 mt-1 line-clamp-2">{page.excerpt}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-blue-500">
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
            <div className="space-y-6 animate-pulse">
              <div className="bg-white p-6 rounded shadow-sm border border-gray-200 flex items-center justify-between">
                <div className="space-y-2 w-1/2">
                  <div className="h-5 bg-gray-200 rounded w-48"></div>
                  <div className="h-4 bg-gray-100 rounded w-full"></div>
                </div>
                <div className="w-20 h-20 bg-gray-100 rounded-full border-4 border-gray-200"></div>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <h3 className="text-lg font-semibold text-gray-800">Analysis Results</h3>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleExportCSV}
                    className="flex-1 sm:flex-none justify-center text-xs font-medium text-[#2271b1] border border-[#2271b1] px-3 py-1.5 rounded hover:bg-blue-50 flex items-center gap-2 transition-colors bg-white"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                  <button
                    onClick={handleReset}
                    className="text-sm text-[#2271b1] hover:text-[#135e96] hover:underline flex items-center gap-1"
                  >
                    <RotateCcw size={14} /> Scan Another Page
                  </button>
                </div>
              </div>

              {/* Score Card */}
              <div className="bg-white p-6 rounded shadow-sm border border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Overall SEO Score</h3>
                  <p className="text-gray-500 text-sm">{result.summary}</p>
                </div>
                <div className={`relative w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl border-4
                  ${result.score >= 80 ? 'border-green-500 text-green-600 bg-green-50' :
                    result.score >= 50 ? 'border-amber-500 text-amber-600 bg-amber-50' :
                    'border-red-500 text-red-600 bg-red-50'}`}>
                  {result.score}
                </div>
              </div>

              {/* Improvements */}
              <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 font-medium text-gray-700 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" /> Improvement Opportunities
                </div>
                <ul className="divide-y divide-gray-100">
                  {result.improvements.map((item, idx) => (
                    <li key={idx} className="px-6 py-4 flex items-start gap-3 hover:bg-gray-50">
                      <div className="mt-1 w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-gray-700 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={handleOptimize}
                    disabled={isOptimizing}
                    className="text-sm font-medium bg-[#2271b1] text-white px-4 py-2 rounded hover:bg-[#135e96] transition-colors flex items-center gap-2 disabled:opacity-70"
                  >
                    {isOptimizing ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                    {isOptimizing ? 'Generating...' : 'Auto-Optimize Content'}
                  </button>
                </div>
              </div>

              {/* Optimization Result */}
              {optimizedContent && (
                <div className="bg-white rounded shadow-sm border border-green-200 ring-4 ring-green-50">
                  <div className="px-6 py-3 border-b border-green-200 bg-green-50 font-medium text-green-800 flex items-center justify-between">
                    <span className="flex items-center gap-2"><Sparkles size={16} /> Optimization Result</span>
                    <span className="text-xs bg-white text-green-700 px-2 py-0.5 rounded border border-green-200">AI Generated</span>
                  </div>
                  <div className="p-6">
                    <div className="text-sm text-gray-800 p-3 bg-green-50/50 rounded border border-green-100">
                      {optimizedContent}
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                      onClick={() => setOptimizedContent(null)}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Discard
                    </button>
                    <button
                      onClick={handleSaveOptimization}
                      className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                    >
                      <Save size={16} /> Apply Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Keywords & Hook */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded shadow-sm border border-gray-200 p-6">
                  <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-500" /> Suggested Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.keywords.map((kw, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#2271b1] to-[#135e96] rounded shadow-sm p-6 text-white">
                  <h4 className="font-medium text-blue-100 mb-2 text-sm uppercase tracking-wider">AI Suggested Hook</h4>
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
