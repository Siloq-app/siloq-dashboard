'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useDashboardContext } from '@/lib/hooks/dashboard-context';
import { useTheme } from '@/lib/hooks/theme-context';
import { fetchWithAuth } from '@/lib/auth-headers';
import { toast } from 'sonner';

interface PreflightCheck {
  name: string;
  status: 'pass' | 'warn' | 'block';
  message: string;
}

interface PreflightResult {
  checks: PreflightCheck[];
  content_id?: number;
  can_approve: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\-\/]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/\/+/g, '/')
    .trim()
    .replace(/^[-\/]+|[-\/]+$/g, '');
}

export default function ContentUpload({ onBack }: { onBack?: () => void }) {
  const { theme: t } = useTheme();
  const { selectedSite } = useDashboardContext();

  const [title, setTitle] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [metaDescription, setMetaDescription] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [images, setImages] = useState<{file: File, alt: string, caption: string, preview: string}[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManual) {
      setSlug(slugify(title));
    }
  }, [title, slugManual]);

  const handleSlugChange = (val: string) => {
    setSlugManual(true);
    // Preserve forward slashes for nested URL paths (e.g., service-area/blue-springs-mo)
    setSlug(slugify(val));
  };

  const acceptedTypes = ['.txt', '.html', '.htm', '.doc', '.docx'];

  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Image handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (images.length >= 10) {
        toast.error('Maximum 10 images allowed');
        return;
      }
      const preview = URL.createObjectURL(file);
      setImages(prev => [...prev, { file, alt: '', caption: '', preview }]);
    });
  };

  const updateImageAlt = (index: number, alt: string) => {
    setImages(prev => prev.map((img, i) => i === index ? { ...img, alt } : img));
  };

  const updateImageCaption = (index: number, caption: string) => {
    setImages(prev => prev.map((img, i) => i === index ? { ...img, caption } : img));
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleFile = useCallback((file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(ext)) {
      toast.error('Unsupported file type. Please use .txt, .html, .doc, or .docx');
      return;
    }
    setFileName(file.name);

    // .docx/.doc files are binary (ZIP archives) — can't read as text
    // Store the file and let the API extract the content server-side
    if (ext === '.docx' || ext === '.doc') {
      setPendingFile(file);
      setContent('[Word document will be processed server-side]');
      toast.success(`${file.name} ready for upload — content will be extracted on the server`);
      return;
    }

    // .txt and .html can be read as text on the client
    setPendingFile(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);
      toast.success(`Loaded content from ${file.name}`);
    };
    reader.onerror = () => toast.error('Failed to read file');
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    if (!selectedSite) {
      toast.error('No site selected');
      return;
    }

    setIsSubmitting(true);
    setPreflight(null);

    try {
      let response;

      // Always use FormData if images are attached or if pendingFile exists
      if (pendingFile || images.length > 0) {
        // Send as multipart form data
        const formData = new FormData();
        if (pendingFile) formData.append('file', pendingFile);
        formData.append('title', title.trim());
        if (slug) formData.append('slug', slug);
        if (metaTitle.trim()) formData.append('meta_title', metaTitle.trim());
        if (targetKeyword.trim()) formData.append('target_keyword', targetKeyword.trim());
        if (metaDescription.trim()) formData.append('meta_description', metaDescription.trim());
        if (excerpt.trim()) formData.append('excerpt', excerpt.trim());
        if (!pendingFile && content.trim()) formData.append('content', content.trim());

        // Append images
        images.forEach((img, idx) => {
          formData.append('images[]', img.file);
          formData.append('image_alts[]', img.alt);
          formData.append('image_captions[]', img.caption);
        });

        response = await fetchWithAuth(
          `/api/v1/sites/${selectedSite.id}/content/upload/`,
          { method: 'POST', body: formData }
          // Note: don't set Content-Type — browser sets it with boundary for multipart
        );
      } else {
        response = await fetchWithAuth(
          `/api/v1/sites/${selectedSite.id}/content/upload/`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: title.trim(),
              content: content.trim(),
              slug: slug || undefined,
              meta_title: metaTitle.trim() || undefined,
              target_keyword: targetKeyword.trim() || undefined,
              meta_description: metaDescription.trim() || undefined,
              excerpt: excerpt.trim() || undefined,
            }),
          }
        );
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || err.error || `Upload failed (${response.status})`);
      }

      const data = await response.json();
      const result: PreflightResult = {
        checks: data.checks || data.preflight || [],
        content_id: data.content_id || data.id,
        can_approve: data.can_approve ?? !(data.checks || data.preflight || []).some((c: PreflightCheck) => c.status === 'block'),
      };
      setPreflight(result);

      // Feature 3: Smart parser auto-populate
      if (data.smart_parsed && data.parsed_fields) {
        const parsed = data.parsed_fields;
        if (parsed.slug) setSlug(parsed.slug);
        if (parsed.meta_title) setMetaTitle(parsed.meta_title);
        if (parsed.meta_description) setMetaDescription(parsed.meta_description);
        toast.success('Smart parser detected city page format — fields auto-populated!');
      } else {
        toast.success('Content uploaded — review preflight results below');
      }
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedSite || !preflight) return;

    setIsApproving(true);
    try {
      const response = await fetchWithAuth(
        `/api/v1/sites/${selectedSite.id}/content/approve/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content_id: preflight.content_id,
            title,
            content,
            slug,
            meta_title: metaTitle || title,
            meta_description: metaDescription,
            excerpt,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || err.error || `Approval failed (${response.status})`);
      }

      toast.success('Content approved and sent to WordPress!');
      // Reset form
      setTitle(''); setMetaTitle(''); setContent(''); setTargetKeyword(''); setSlug('');
      setSlugManual(false); setMetaDescription(''); setExcerpt('');
      setFileName(''); setPendingFile(null); setPreflight(null);
      images.forEach(img => URL.revokeObjectURL(img.preview));
      setImages([]);
    } catch (err: any) {
      toast.error(err.message || 'Approval failed');
    } finally {
      setIsApproving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${t.border}`,
    background: t.inputBg || t.card,
    color: t.text,
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: t.textSecondary || t.text,
    marginBottom: 6,
    display: 'block',
  };

  return (
    <div style={{ maxWidth: 720, fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {onBack && (
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: t.accent, fontSize: 13, cursor: 'pointer', padding: '0 0 16px', display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Back to Content Hub
        </button>
      )}

      <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: t.text }}>Upload Your Content</h1>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: t.textMuted }}>
        Paste or upload an article to run preflight checks before publishing to WordPress.
      </p>

      {/* File Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: '28px 20px',
          borderRadius: 12,
          border: `2px dashed ${isDragging ? t.accent : t.border}`,
          background: isDragging ? (t.accentGlow || `${t.accent}10`) : t.card,
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: 20,
          transition: 'all 0.2s',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.html,.htm,.doc,.docx"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>
          {fileName ? fileName : 'Drop a file here or click to browse'}
        </div>
        <div style={{ fontSize: 12, color: t.textDim || t.textMuted, marginTop: 4 }}>
          Accepts .txt, .html, .doc, .docx
        </div>
      </div>

      {/* Title */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Title <span style={{ color: t.red || '#ef4444' }}>*</span></label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your article title" style={inputStyle} />
      </div>

      {/* Meta Title */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Meta Title (for search results)</label>
        <input
          value={metaTitle}
          onChange={(e) => { if (e.target.value.length <= 70) setMetaTitle(e.target.value); }}
          placeholder="Leave blank to use page title"
          style={inputStyle}
        />
        <div style={{ fontSize: 12, marginTop: 4, color: metaTitle.length > 60 ? (t.orange || '#f59e0b') : (t.textDim || t.textMuted) }}>
          {metaTitle.length}/60 characters {metaTitle.length > 60 && '— exceeds ideal length'}
        </div>
      </div>

      {/* Content */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Content <span style={{ color: t.red || '#ef4444' }}>*</span></label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your full article here, or upload a file above..."
          rows={14}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
        />
      </div>

      {/* Image Upload Section */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Add Images (up to 10)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          style={{ display: 'none' }}
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            borderRadius: 8,
            border: `1px solid ${t.border}`,
            background: t.card,
            color: t.text,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 12,
          }}
        >
          📷 Choose Images
        </label>
        {images.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {images.map((img, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${t.border}`,
                  background: t.card,
                  alignItems: 'flex-start',
                }}
              >
                <img
                  src={img.preview}
                  alt=""
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    value={img.alt}
                    onChange={(e) => updateImageAlt(idx, e.target.value)}
                    placeholder="Alt text (required for SEO)"
                    style={{ ...inputStyle, marginBottom: 0 }}
                  />
                  <input
                    value={img.caption}
                    onChange={(e) => updateImageCaption(idx, e.target.value)}
                    placeholder="Caption (optional)"
                    style={{ ...inputStyle, marginBottom: 0 }}
                  />
                </div>
                <button
                  onClick={() => removeImage(idx)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: 'none',
                    background: t.red || '#ef4444',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Target Keyword */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Target Keyword</label>
        <input value={targetKeyword} onChange={(e) => setTargetKeyword(e.target.value)} placeholder="e.g., emergency roof repair" style={inputStyle} />
      </div>

      {/* URL Slug */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>URL Slug</label>
        <input value={slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="auto-generated-from-title" style={inputStyle} />
        {slug && (
          <div style={{ fontSize: 12, color: t.textDim || t.textMuted, marginTop: 4 }}>
            Preview: <span style={{ color: t.accent }}>{(selectedSite as any)?.domain || selectedSite?.url?.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'yourdomain.com'}/{slug}</span>
          </div>
        )}
      </div>

      {/* Meta Description */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Meta Description</label>
        <textarea
          value={metaDescription}
          onChange={(e) => { if (e.target.value.length <= 200) setMetaDescription(e.target.value); }}
          placeholder="Brief description for search engines (recommended 150-160 characters)"
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <div style={{ fontSize: 12, marginTop: 4, color: metaDescription.length > 160 ? (t.orange || '#f59e0b') : (t.textDim || t.textMuted) }}>
          {metaDescription.length}/160 characters {metaDescription.length > 160 && '— may be truncated in search results'}
        </div>
      </div>

      {/* Excerpt */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Excerpt</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Short summary for previews and social sharing"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !title.trim() || !content.trim()}
        style={{
          padding: '12px 28px',
          borderRadius: 10,
          border: 'none',
          background: (!title.trim() || !content.trim()) ? (t.border) : `linear-gradient(135deg, ${t.accent}, #8B5CF6)`,
          color: (!title.trim() || !content.trim()) ? t.textDim || t.textMuted : '#fff',
          fontSize: 15,
          fontWeight: 700,
          cursor: (!title.trim() || !content.trim()) ? 'not-allowed' : 'pointer',
          boxShadow: (title.trim() && content.trim()) ? `0 2px 12px ${t.accent}35` : 'none',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {isSubmitting ? (
          <>
            <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Running Preflight Checks...
          </>
        ) : (
          '⚡ Upload & Check'
        )}
      </button>

      {/* Preflight Results */}
      {preflight && (
        <div style={{ marginTop: 24, padding: 20, background: t.card, borderRadius: 12, border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: t.text }}>Preflight Results</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {preflight.checks.map((check, i) => {
              const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '🚫';
              const color = check.status === 'pass' ? (t.green) : check.status === 'warn' ? (t.orange || '#f59e0b') : (t.red || '#ef4444');
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', borderRadius: 8, background: `${color}08`, border: `1px solid ${color}20` }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{check.name}</div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>{check.message}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {preflight.can_approve && (
            <button
              onClick={handleApprove}
              disabled={isApproving}
              style={{
                marginTop: 16,
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: t.green,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: isApproving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {isApproving ? 'Approving...' : '✓ Approve & Send to WordPress'}
            </button>
          )}

          {!preflight.can_approve && (
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: `${t.red || '#ef4444'}10`, border: `1px solid ${t.red || '#ef4444'}20`, fontSize: 13, color: t.red || '#ef4444' }}>
              Content has blocking issues that must be resolved before approval.
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
