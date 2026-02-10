'use client';

import { useState } from 'react';
import { X, Zap, ChevronDown, Loader2, CheckCircle2, Link2 } from 'lucide-react';
import { Silo } from '@/app/dashboard/types';
import { cn } from '@/lib/utils';

interface Props {
  silos: Silo[];
  onClose: () => void;
}

export default function GenerateModal({ silos, onClose }: Props) {
  const [selectedSiloId, setSelectedSiloId] = useState<number>(silos[0]?.id || 0);
  const [contentType, setContentType] = useState('Supporting Article (Soldier)');
  const [entityCluster, setEntityCluster] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    title: string;
    internalLink: string;
    targetPage: string;
  } | null>(null);

  const selectedSilo = silos.find((s) => s.id === selectedSiloId);

  const handleGenerate = async () => {
    if (!selectedSilo) return;

    setIsGenerating(true);

    // Simulate API call to generate content with internal link
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate content with auto-included internal link
    const anchorText = entityCluster.split(',')[0] || 'learn more';
    const internalLinkHtml = `<a href="${selectedSilo.targetPage.url}">${anchorText}</a>`;

    setGeneratedContent({
      title: `${entityCluster || 'New Supporting Page'} - ${selectedSilo.name}`,
      internalLink: internalLinkHtml,
      targetPage: selectedSilo.targetPage.title,
    });

    setIsGenerating(false);
    setIsComplete(true);
  };

  if (isComplete && generatedContent) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-[500px] rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Content Generated
            </h2>
            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
            <div className="mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={20} />
              <span className="font-medium">Successfully generated!</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <strong>{generatedContent.title}</strong>
            </p>
          </div>

          <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900/30 dark:bg-indigo-950/20">
            <div className="mb-2 flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
              <Link2 size={16} />
              <span className="text-sm font-medium">Auto-inserted internal link:</span>
            </div>
            <code className="block rounded bg-white px-3 py-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {generatedContent.internalLink}
            </code>
            <p className="mt-2 text-xs text-slate-500">
              Linking to: {generatedContent.targetPage}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={onClose}
            >
              Close
            </button>
            <button
              className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-indigo-700"
              onClick={() => {
                setIsComplete(false);
                setGeneratedContent(null);
              }}
            >
              <Zap size={14} />
              Generate Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[500px] rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Generate Supporting Page
          </h2>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Target Silo <span className="text-red-500">*</span>
            <span className="ml-1 text-xs font-normal text-slate-500">
              (links UP to this Target Page)
            </span>
          </label>
          <div className="relative">
            <select
              value={selectedSiloId}
              onChange={(e) => setSelectedSiloId(Number(e.target.value))}
              required
              className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" disabled>
                Select a silo...
              </option>
              {silos.map((silo) => (
                <option key={silo.id} value={silo.id}>
                  👑 {silo.name} → {silo.targetPage.title}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
          {!selectedSilo && (
            <p className="mt-1 text-xs text-red-500">
              Please select a target silo
            </p>
          )}
        </div>

        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Content Type <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option>Supporting Article (Soldier)</option>
              <option>FAQ Page</option>
              <option>How-To Guide</option>
              <option>Comparison Article</option>
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Target Entity Cluster <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={entityCluster}
            onChange={(e) => setEntityCluster(e.target.value)}
            placeholder="e.g., kitchen lighting, under-cabinet lights, pendant lights"
            required
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
          {!entityCluster && (
            <p className="mt-1 text-xs text-red-500">
              Entity cluster is required
            </p>
          )}
          <div className="mt-1.5 text-[11px] text-slate-500">
            Entity sources: NLP extraction • Google Knowledge Graph • GSC
            queries
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/30 dark:bg-indigo-950/20">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
            <Zap size={12} className="fill-indigo-700 dark:fill-indigo-400" />
            Siloq will automatically:
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span>Check for entity overlap with sibling pages</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span className="font-medium text-indigo-600">
                Include internal link to Target Page ({selectedSilo?.targetPage.title || 'None selected'})
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span>Apply schema markup</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span>Queue for your approval before publishing</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!selectedSilo || !entityCluster || isGenerating}
            className={cn(
              'inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow transition-colors',
              !selectedSilo || !entityCluster || isGenerating
                ? 'cursor-not-allowed bg-slate-300 text-slate-500'
                : 'bg-black text-white hover:bg-gray-800'
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap size={14} />
                Generate Content
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
