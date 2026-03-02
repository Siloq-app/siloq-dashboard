'use client';

import { useState, useRef, useCallback } from 'react';
import {
  X,
  Copy,
  Check,
  Upload,
  Save,
  Eye,
  Code,
  Loader2,
  FileText,
  Globe,
  RefreshCw,
} from 'lucide-react';

interface ContentData {
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  body: string;
  wordCount: number;
  targetKeyword?: string;
  suggestedSlug?: string;
  siloId?: number;
}

interface ContentPreviewModalProps {
  content: ContentData;
  isGenerating?: boolean;
  generatingStep?: string;
  onClose: () => void;
  onPushToWordPress: (content: ContentData, publishMode: 'publish' | 'draft') => Promise<void>;
  onRegenerate?: () => Promise<void>;
  siteId: number;
}

export default function ContentPreviewModal({
  content: initialContent,
  isGenerating = false,
  generatingStep,
  onClose,
  onPushToWordPress,
  onRegenerate,
  siteId,
}: ContentPreviewModalProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    setIsRegenerating(true);
    setPushState('idle');
    try {
      await onRegenerate();
    } finally {
      setIsRegenerating(false);
    }
  };
  const [content, setContent] = useState<ContentData>(initialContent);
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');
  const [pushState, setPushState] = useState<
    'idle' | 'pushing' | 'success-publish' | 'success-draft' | 'error'
  >('idle');
  const [copied, setCopied] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Update content when initialContent changes (e.g., generation completes)
  const prevBodyRef = useRef(initialContent.body);
  if (initialContent.body !== prevBodyRef.current) {
    prevBodyRef.current = initialContent.body;
    setContent(initialContent);
  }

  const metaTitleLen = (content.metaTitle || content.title || '').length;
  const metaDescLen = (content.metaDescription || '').length;
  const wordCount = content.body
    ? content.body
        .replace(/<[^>]*>/g, ' ')
        .split(/\s+/)
        .filter(Boolean).length
    : 0;

  const handleCopyAll = useCallback(async () => {
    const text = [
      `Title: ${content.title}`,
      content.metaTitle ? `Meta Title: ${content.metaTitle}` : '',
      content.metaDescription ? `Meta Description: ${content.metaDescription}` : '',
      '',
      content.body
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    ]
      .filter(Boolean)
      .join('\n');

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const handleCopyHtml = useCallback(async () => {
    await navigator.clipboard.writeText(content.body);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  }, [content]);

  const handlePush = useCallback(
    async (mode: 'publish' | 'draft') => {
      setPushState('pushing');
      try {
        await onPushToWordPress(content, mode);
        setPushState(mode === 'publish' ? 'success-publish' : 'success-draft');
      } catch {
        setPushState('error');
        setTimeout(() => setPushState('idle'), 3000);
      }
    },
    [content, onPushToWordPress]
  );

  const updateField = (field: keyof ContentData, value: string) => {
    setContent((prev) => ({ ...prev, [field]: value }));
  };

  const isSuccess = pushState === 'success-publish' || pushState === 'success-draft';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: '#00000099',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex max-h-[90vh] w-[90vw] max-w-[900px] flex-col overflow-hidden rounded-2xl border"
        style={{
          background: '#1a1a2e',
          borderColor: '#006ff94D',
          boxShadow: '0 25px 60px #000000CC',
        }}
      >
        {/* Header */}
        <div className="border-b p-5 pb-4" style={{ borderBottomColor: '#FFFFFF14' }}>
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <FileText size={20} style={{ color: '#006ff9' }} />
              <span
                className="text-[13px] font-semibold uppercase tracking-[0.05em]"
                style={{ color: '#006ff9' }}
              >
                Content Preview
              </span>
              {onRegenerate && !isGenerating && (
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  title="Regenerate content"
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border p-[3px_10px] transition-all duration-200"
                  style={{
                    background: '#006ff91A',
                    borderColor: '#006ff940',
                    opacity: isRegenerating ? 0.6 : 1,
                  }}
                >
                  <RefreshCw
                    size={12}
                    style={isRegenerating ? { animation: 'spin 1s linear infinite' } : {}}
                  />
                  {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                </button>
              )}
              {content.targetKeyword && (
                <span
                  className="rounded-[12px] border px-[10px] py-[2px] text-[11px] font-semibold"
                  style={{
                    background: '#006ff926',
                    color: '#4D94FF',
                    borderColor: '#006ff940',
                  }}
                >
                  🎯 {content.targetKeyword}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-md border-none bg-none p-1 transition-colors duration-200"
              style={{ color: '#888' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Generating state */}
          {isGenerating && (
            <div
              className="flex items-center gap-2.5 rounded-lg border p-3"
              style={{
                background: '#006ff91A',
                borderColor: '#006ff933',
              }}
            >
              <Loader2
                size={16}
                style={{ color: '#006ff9', animation: 'spin 1s linear infinite' }}
              />
              <span className="text-[13px] font-medium" style={{ color: '#4D94FF' }}>
                {generatingStep || 'Generating content with AI...'}
              </span>
            </div>
          )}

          {/* Success state */}
          {isSuccess && (
            <div
              className="flex items-center gap-2.5 rounded-lg border p-3"
              style={{
                background: '#22C55E1A',
                borderColor: '#22C55E40',
              }}
            >
              <Check size={16} style={{ color: '#22C55E' }} />
              <span className="text-[13px] font-semibold" style={{ color: '#22C55E' }}>
                {pushState === 'success-publish'
                  ? 'Published to WordPress ✓'
                  : 'Saved as draft in WordPress ✓'}
              </span>
            </div>
          )}

          {/* Error state */}
          {pushState === 'error' && (
            <div
              className="flex items-center gap-2.5 rounded-lg border p-3"
              style={{
                background: '#EF44441A',
                borderColor: '#EF444440',
              }}
            >
              <span className="text-[13px] font-semibold" style={{ color: '#EF4444' }}>
                Failed to push to WordPress. Please try again.
              </span>
            </div>
          )}

          {/* Editable meta fields */}
          {!isGenerating && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginTop: isSuccess || pushState === 'error' ? 12 : 0,
              }}
            >
              {/* Title */}
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Page Title
                </label>
                <input
                  value={content.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    marginTop: 4,
                    background: '#FFFFFF0D',
                    border: '1px solid #FFFFFF1A',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Meta Title + Meta Description row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#666',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Meta Title
                    </label>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color:
                          metaTitleLen > 60 ? '#EF4444' : metaTitleLen > 50 ? '#F59E0B' : '#666',
                      }}
                    >
                      {metaTitleLen}/60
                    </span>
                  </div>
                  <input
                    value={content.metaTitle || content.title}
                    onChange={(e) => updateField('metaTitle', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      marginTop: 4,
                      background: '#FFFFFF0D',
                      border: '1px solid #FFFFFF1A',
                      borderRadius: 6,
                      color: '#ccc',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#666',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Meta Description
                    </label>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color:
                          metaDescLen > 160 ? '#EF4444' : metaDescLen > 140 ? '#F59E0B' : '#666',
                      }}
                    >
                      {metaDescLen}/160
                    </span>
                  </div>
                  <textarea
                    value={content.metaDescription || ''}
                    onChange={(e) => updateField('metaDescription', e.target.value)}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      marginTop: 4,
                      background: '#FFFFFF0D',
                      border: '1px solid #FFFFFF1A',
                      borderRadius: 6,
                      color: '#ccc',
                      fontSize: 13,
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          {isGenerating ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 300,
                gap: 16,
              }}
            >
              <Loader2
                size={40}
                style={{ color: '#006ff9', animation: 'spin 1s linear infinite' }}
              />
              <p style={{ color: '#888', fontSize: 14 }}>Building your content...</p>
            </div>
          ) : (
            <>
              {/* View toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 24px',
                  borderBottom: '1px solid #FFFFFF0D',
                  background: '#00000033',
                }}
              >
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => setViewMode('preview')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      background: viewMode === 'preview' ? '#006ff933' : 'transparent',
                      color: viewMode === 'preview' ? '#4D94FF' : '#666',
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Eye size={13} /> Preview
                  </button>
                  <button
                    onClick={() => setViewMode('html')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      background: viewMode === 'html' ? '#006ff933' : 'transparent',
                      color: viewMode === 'html' ? '#4D94FF' : '#666',
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Code size={13} /> HTML
                  </button>
                </div>
                <span style={{ fontSize: 12, color: '#666' }}>
                  {wordCount.toLocaleString()} words
                </span>
              </div>

              {viewMode === 'preview' ? (
                <div
                  ref={previewRef}
                  className="content-preview-body"
                  dangerouslySetInnerHTML={{ __html: content.body }}
                  style={{
                    padding: '24px 32px',
                    color: '#ddd',
                    fontSize: 15,
                    lineHeight: 1.75,
                    minHeight: 200,
                  }}
                />
              ) : (
                <textarea
                  value={content.body}
                  onChange={(e) => updateField('body', e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: 400,
                    padding: '16px 24px',
                    background: 'transparent',
                    border: 'none',
                    color: '#aaa',
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontSize: 13,
                    lineHeight: 1.6,
                    resize: 'none',
                    outline: 'none',
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isGenerating && (
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid #FFFFFF14',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#00000026',
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleCopyHtml}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #006ff94D',
                  background: '#006ff91A',
                  color: '#4D94FF',
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                  fontWeight: 600,
                }}
              >
                {copiedHtml ? <Check size={14} /> : <Code size={14} />}
                {copiedHtml ? 'Copied HTML!' : 'Copy HTML'}
              </button>
              <button
                onClick={handleCopyAll}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #FFFFFF1A',
                  background: 'transparent',
                  color: '#aaa',
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #FFFFFF1A',
                  background: 'transparent',
                  color: '#888',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>

            {!isSuccess && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handlePush('draft')}
                  disabled={pushState === 'pushing'}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    border: '1px solid #22C55E4D',
                    background: '#22C55E1A',
                    color: '#22C55E',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: pushState === 'pushing' ? 0.6 : 1,
                  }}
                >
                  {pushState === 'pushing' ? (
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Save size={14} />
                  )}
                  Save as WP Draft
                </button>
                <button
                  onClick={() => handlePush('publish')}
                  disabled={pushState === 'pushing'}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #006ff9, #005acc)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 10px #006ff959',
                    opacity: pushState === 'pushing' ? 0.6 : 1,
                  }}
                >
                  {pushState === 'pushing' ? (
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Globe size={14} />
                  )}
                  Publish to WordPress
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .content-preview-body h1 { font-size: 24px; font-weight: 700; margin: 0 0 16px; color: #fff; }
        .content-preview-body h2 { font-size: 20px; font-weight: 600; margin: 24px 0 12px; color: #eee; }
        .content-preview-body h3 { font-size: 17px; font-weight: 600; margin: 20px 0 10px; color: #ddd; }
        .content-preview-body p { margin: 0 0 14px; }
        .content-preview-body ul, .content-preview-body ol { margin: 0 0 14px; padding-left: 24px; }
        .content-preview-body li { margin-bottom: 6px; }
        .content-preview-body a { color: #006ff9; text-decoration: underline; }
        .content-preview-body strong { color: #fff; }
        .content-preview-body blockquote { border-left: 3px solid #006ff9; padding-left: 16px; margin: 16px 0; color: #aaa; font-style: italic; }
      `}</style>
    </div>
  );
}
