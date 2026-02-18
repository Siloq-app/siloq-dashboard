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
  siteId: number;
}

export default function ContentPreviewModal({
  content: initialContent,
  isGenerating = false,
  generatingStep,
  onClose,
  onPushToWordPress,
  siteId,
}: ContentPreviewModalProps) {
  const [content, setContent] = useState<ContentData>(initialContent);
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');
  const [pushState, setPushState] = useState<'idle' | 'pushing' | 'success-publish' | 'success-draft' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Update content when initialContent changes (e.g., generation completes)
  const prevBodyRef = useRef(initialContent.body);
  if (initialContent.body !== prevBodyRef.current) {
    prevBodyRef.current = initialContent.body;
    setContent(initialContent);
  }

  const metaTitleLen = (content.metaTitle || content.title || '').length;
  const metaDescLen = (content.metaDescription || '').length;
  const wordCount = content.body ? content.body.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length : 0;

  const handleCopyAll = useCallback(async () => {
    const text = [
      `Title: ${content.title}`,
      content.metaTitle ? `Meta Title: ${content.metaTitle}` : '',
      content.metaDescription ? `Meta Description: ${content.metaDescription}` : '',
      '',
      content.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    ].filter(Boolean).join('\n');
    
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const handlePush = useCallback(async (mode: 'publish' | 'draft') => {
    setPushState('pushing');
    try {
      await onPushToWordPress(content, mode);
      setPushState(mode === 'publish' ? 'success-publish' : 'success-draft');
    } catch {
      setPushState('error');
      setTimeout(() => setPushState('idle'), 3000);
    }
  }, [content, onPushToWordPress]);

  const updateField = (field: keyof ContentData, value: string) => {
    setContent(prev => ({ ...prev, [field]: value }));
  };

  const isSuccess = pushState === 'success-publish' || pushState === 'success-draft';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: '90vw', maxWidth: 900, maxHeight: '90vh',
          background: '#1a1a2e', borderRadius: 16,
          border: '1px solid rgba(139,92,246,0.3)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={20} style={{ color: '#8B5CF6' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Content Preview
              </span>
              {content.targetKeyword && (
                <span style={{
                  padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                  background: 'rgba(139,92,246,0.15)', color: '#A78BFA',
                  border: '1px solid rgba(139,92,246,0.25)',
                }}>
                  {content.targetKeyword}
                </span>
              )}
            </div>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: '#888', cursor: 'pointer',
              padding: 4, borderRadius: 6, transition: 'color 0.2s',
            }}>
              <X size={20} />
            </button>
          </div>

          {/* Generating state */}
          {isGenerating && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              background: 'rgba(139,92,246,0.1)', borderRadius: 10,
              border: '1px solid rgba(139,92,246,0.2)',
            }}>
              <Loader2 size={16} style={{ color: '#8B5CF6', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13, color: '#A78BFA', fontWeight: 500 }}>
                {generatingStep || 'Generating content with AI...'}
              </span>
            </div>
          )}

          {/* Success state */}
          {isSuccess && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              background: 'rgba(34,197,94,0.1)', borderRadius: 10,
              border: '1px solid rgba(34,197,94,0.25)',
            }}>
              <Check size={16} style={{ color: '#22C55E' }} />
              <span style={{ fontSize: 13, color: '#22C55E', fontWeight: 600 }}>
                {pushState === 'success-publish' ? 'Published to WordPress ✓' : 'Saved as draft in WordPress ✓'}
              </span>
            </div>
          )}

          {/* Error state */}
          {pushState === 'error' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              background: 'rgba(239,68,68,0.1)', borderRadius: 10,
              border: '1px solid rgba(239,68,68,0.25)',
            }}>
              <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 600 }}>
                Failed to push to WordPress. Please try again.
              </span>
            </div>
          )}

          {/* Editable meta fields */}
          {!isGenerating && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: isSuccess || pushState === 'error' ? 12 : 0 }}>
              {/* Title */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Page Title
                </label>
                <input
                  value={content.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', marginTop: 4,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, color: '#fff', fontSize: 16, fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Meta Title + Meta Description row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Meta Title
                    </label>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: metaTitleLen > 60 ? '#EF4444' : metaTitleLen > 50 ? '#F59E0B' : '#666',
                    }}>
                      {metaTitleLen}/60
                    </span>
                  </div>
                  <input
                    value={content.metaTitle || content.title}
                    onChange={(e) => updateField('metaTitle', e.target.value)}
                    style={{
                      width: '100%', padding: '6px 10px', marginTop: 4,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6, color: '#ccc', fontSize: 13, outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Meta Description
                    </label>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: metaDescLen > 160 ? '#EF4444' : metaDescLen > 140 ? '#F59E0B' : '#666',
                    }}>
                      {metaDescLen}/160
                    </span>
                  </div>
                  <textarea
                    value={content.metaDescription || ''}
                    onChange={(e) => updateField('metaDescription', e.target.value)}
                    rows={2}
                    style={{
                      width: '100%', padding: '6px 10px', marginTop: 4,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6, color: '#ccc', fontSize: 13, outline: 'none',
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
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: 300, gap: 16,
            }}>
              <Loader2 size={40} style={{ color: '#8B5CF6', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: '#888', fontSize: 14 }}>Building your content...</p>
            </div>
          ) : (
            <>
              {/* View toggle */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(0,0,0,0.2)',
              }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => setViewMode('preview')}
                    style={{
                      padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      background: viewMode === 'preview' ? 'rgba(139,92,246,0.2)' : 'transparent',
                      color: viewMode === 'preview' ? '#A78BFA' : '#666',
                      fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <Eye size={13} /> Preview
                  </button>
                  <button
                    onClick={() => setViewMode('html')}
                    style={{
                      padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      background: viewMode === 'html' ? 'rgba(139,92,246,0.2)' : 'transparent',
                      color: viewMode === 'html' ? '#A78BFA' : '#666',
                      fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
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
                    padding: '24px 32px', color: '#ddd', fontSize: 15, lineHeight: 1.75,
                    minHeight: 200,
                  }}
                />
              ) : (
                <textarea
                  value={content.body}
                  onChange={(e) => updateField('body', e.target.value)}
                  style={{
                    width: '100%', minHeight: 400, padding: '16px 24px',
                    background: 'transparent', border: 'none', color: '#aaa',
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontSize: 13, lineHeight: 1.6, resize: 'none', outline: 'none',
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isGenerating && (
          <div style={{
            padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleCopyAll}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: '#aaa', fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy All'}
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: '#888', fontSize: 13, cursor: 'pointer',
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
                    padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.3)',
                    background: 'rgba(34,197,94,0.1)', color: '#22C55E',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    opacity: pushState === 'pushing' ? 0.6 : 1,
                  }}
                >
                  {pushState === 'pushing' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                  Save as WP Draft
                </button>
                <button
                  onClick={() => handlePush('publish')}
                  disabled={pushState === 'pushing'}
                  style={{
                    padding: '8px 20px', borderRadius: 8, border: 'none',
                    background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                    color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 2px 10px rgba(139,92,246,0.35)',
                    opacity: pushState === 'pushing' ? 0.6 : 1,
                  }}
                >
                  {pushState === 'pushing' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Globe size={14} />}
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
        .content-preview-body a { color: #8B5CF6; text-decoration: underline; }
        .content-preview-body strong { color: #fff; }
        .content-preview-body blockquote { border-left: 3px solid #8B5CF6; padding-left: 16px; margin: 16px 0; color: #aaa; font-style: italic; }
      `}</style>
    </div>
  );
}
