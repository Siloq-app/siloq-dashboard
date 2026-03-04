'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useDashboardContext } from '@/lib/hooks/dashboard-context';
import { useTheme } from '@/lib/hooks/theme-context';
import { fetchWithAuth } from '@/lib/auth';
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
    .replace(/[^\w\s\-/]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/\/+/g, '/')
    .trim()
    .replace(/^[-/]+|[-/]+$/g, '');
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
  const [images, setImages] = useState<
    { file: File; alt: string; caption: string; preview: string }[]
  >([]);

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

  const acceptedTypes = useMemo(() => ['.txt', '.html', '.htm', '.doc', '.docx'], []);

  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Image handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (images.length >= 10) {
        toast.error('Maximum 10 images allowed');
        return;
      }
      const preview = URL.createObjectURL(file);
      setImages((prev) => [...prev, { file, alt: '', caption: '', preview }]);
    });
  };

  const updateImageAlt = (index: number, alt: string) => {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, alt } : img)));
  };

  const updateImageCaption = (index: number, caption: string) => {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, caption } : img)));
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
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
  }, [acceptedTypes]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

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
        images.forEach((img, _idx) => {
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
        response = await fetchWithAuth(`/api/v1/sites/${selectedSite.id}/content/upload/`, {
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
        });
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || err.error || `Upload failed (${response.status})`);
      }

      const data = await response.json();
      const result: PreflightResult = {
        checks: data.checks || data.preflight || [],
        content_id: data.content_id || data.id,
        can_approve:
          data.can_approve ??
          !(data.checks || data.preflight || []).some((c: PreflightCheck) => c.status === 'block'),
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
      const response = await fetchWithAuth(`/api/v1/sites/${selectedSite.id}/content/approve/`, {
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
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || err.error || `Approval failed (${response.status})`);
      }

      toast.success('Content approved and sent to WordPress!');
      // Reset form
      setTitle('');
      setMetaTitle('');
      setContent('');
      setTargetKeyword('');
      setSlug('');
      setSlugManual(false);
      setMetaDescription('');
      setExcerpt('');
      setFileName('');
      setPendingFile(null);
      setPreflight(null);
      images.forEach((img) => URL.revokeObjectURL(img.preview));
      setImages([]);
    } catch (err: any) {
      toast.error(err.message || 'Approval failed');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div
      className="max-w-[720px]"
      style={{ fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {onBack && (
        <button
          onClick={onBack}
          className="flex cursor-pointer items-center gap-1 border-none bg-none p-0 pb-4 text-[13px]"
          style={{ color: t.accent }}
        >
          ← Back to Content Hub
        </button>
      )}

      <h1 className="mb-1 text-[22px] font-bold" style={{ color: t.text }}>
        Upload Your Content
      </h1>
      <p className="mb-6 text-[14px]" style={{ color: t.textMuted }}>
        Paste or upload an article to run preflight checks before publishing to WordPress.
      </p>

      {/* File Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="mb-5 cursor-pointer rounded-[12px] border-2 border-dashed p-7 text-center transition-all duration-200"
        style={{
          borderColor: isDragging ? t.accent : t.border,
          background: isDragging ? t.accentGlow || `${t.accent}10` : t.card,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.html,.htm,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <div className="mb-2 text-[28px]">📄</div>
        <div className="text-[14px] font-semibold" style={{ color: t.text }}>
          {fileName ? fileName : 'Drop a file here or click to browse'}
        </div>
        <div className="mt-1 text-[12px]" style={{ color: t.textDim || t.textMuted }}>
          Accepts .txt, .html, .doc, .docx
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <label
          className="mb-1.5 block text-[13px] font-semibold"
          style={{ color: t.textSecondary || t.text }}
        >
          Title <span style={{ color: t.red || '#ef4444' }}>*</span>
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Your article title"
          className="font-inherit box-border w-full rounded-lg border p-[10px_14px] text-[14px] outline-none"
          style={{
            borderColor: t.border,
            background: t.inputBg || t.card,
            color: t.text,
          }}
        />
      </div>

      {/* Meta Title */}
      <div className="mb-4">
        <label
          className="mb-1.5 block text-[13px] font-semibold"
          style={{ color: t.textSecondary || t.text }}
        >
          Meta Title (for search results)
        </label>
        <input
          value={metaTitle}
          onChange={(e) => {
            if (e.target.value.length <= 70) setMetaTitle(e.target.value);
          }}
          placeholder="Leave blank to use page title"
          className="font-inherit box-border w-full rounded-lg border p-[10px_14px] text-[14px] outline-none"
          style={{
            borderColor: t.border,
            background: t.inputBg || t.card,
            color: t.text,
          }}
        />
        <div
          className="mt-1 text-[12px]"
          style={{ color: metaTitle.length > 60 ? t.gold || '#f59e0b' : t.textDim || t.textMuted }}
        >
          {metaTitle.length}/60 characters {metaTitle.length > 60 && '— exceeds ideal length'}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <label
          className="mb-1.5 block text-[13px] font-semibold"
          style={{ color: t.textSecondary || t.text }}
        >
          Content <span style={{ color: t.red || '#ef4444' }}>*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your full article here, or upload a file above..."
          rows={14}
          className="font-inherit box-border w-full resize-y rounded-lg border p-[10px_14px] text-[14px] outline-none"
          style={{
            borderColor: t.border,
            background: t.inputBg || t.card,
            color: t.text,
            lineHeight: 1.6,
          }}
        />
      </div>

      {/* Image Upload Section */}
      <div className="mb-4">
        <label
          className="mb-1.5 block text-[13px] font-semibold"
          style={{ color: t.textSecondary || t.text }}
        >
          Add Images (up to 10)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="inline-block cursor-pointer rounded-lg border p-2 text-[14px] font-semibold transition-all duration-200"
          style={{
            borderColor: t.border,
            background: t.card,
            color: t.text,
          }}
        >
          📷 Choose Images
        </label>
        {images.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg border p-3"
                style={{
                  borderColor: t.border,
                  background: t.card,
                }}
              >
                <img
                  src={img.preview}
                  alt=""
                  className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                />
                <div className="flex flex-1 flex-col gap-2">
                  <input
                    value={img.alt}
                    onChange={(e) => updateImageAlt(idx, e.target.value)}
                    placeholder="Alt text (required for SEO)"
                    className="font-inherit mb-0 box-border w-full rounded-lg border p-[10px_14px] text-[14px] outline-none"
                    style={{
                      borderColor: t.border,
                      background: t.inputBg || t.card,
                      color: t.text,
                    }}
                  />
                  <input
                    value={img.caption}
                    onChange={(e) => updateImageCaption(idx, e.target.value)}
                    placeholder="Caption (optional)"
                    className="font-inherit mb-0 box-border w-full rounded-lg border p-[10px_14px] text-[14px] outline-none"
                    style={{
                      borderColor: t.border,
                      background: t.inputBg || t.card,
                      color: t.text,
                    }}
                  />
                </div>
                <button
                  onClick={() => removeImage(idx)}
                  className="flex-shrink-0 cursor-pointer rounded-md border-none bg-red-500 p-[6px_10px] text-[12px] font-semibold text-white"
                  style={{
                    background: t.red || '#ef4444',
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
      <div className="mb-4">
        <label
          className="mb-1.5 block text-[13px] font-semibold"
          style={{ color: t.textSecondary || t.text }}
        >
          Target Keyword
        </label>
        <input
          value={targetKeyword}
          onChange={(e) => setTargetKeyword(e.target.value)}
          placeholder="e.g., emergency roof repair"
          className="font-inherit box-border w-full rounded-lg border p-[10px_14px] text-[14px] outline-none"
          style={{
            borderColor: t.border,
            background: t.inputBg || t.card,
            color: t.text,
          }}
        />
      </div>

      {/* URL Slug */}
      <div className="mb-4">
        <label
          className="mb-1.5 block text-[13px] font-semibold"
          style={{ color: t.textSecondary || t.text }}
        >
          URL Slug
        </label>
        <input
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="auto-generated-from-title"
          className="font-inherit box-border w-full rounded-lg border p-[10px_14px] text-[14px] outline-none"
          style={{
            borderColor: t.border,
            background: t.inputBg || t.card,
            color: t.text,
          }}
        />
        {slug && (
          <div className="mt-1 text-[12px]" style={{ color: t.textDim || t.textMuted }}>
            Preview:{' '}
            <span className="font-semibold" style={{ color: t.accent }}>
              {(selectedSite as any)?.domain ||
                selectedSite?.url?.replace(/^https?:\/\//, '').replace(/\/$/, '') ||
                'yourdomain.com'}
              /{slug}
            </span>
          </div>
        )}
      </div>

      {/* Meta Description */}
      <div className="mb-4">
        <label
          className="mb-1.5 block text-[13px] font-semibold"
          style={{ color: t.textSecondary || t.text }}
        >
          Meta Description
        </label>
        <textarea
          value={metaDescription}
          onChange={(e) => {
            if (e.target.value.length <= 200) setMetaDescription(e.target.value);
          }}
          placeholder="Brief description for search engines (recommended 150-160 characters)"
          rows={2}
          className="font-inherit box-border w-full resize-y rounded-lg border p-[10px_14px] text-[14px] outline-none"
          style={{
            borderColor: t.border,
            background: t.inputBg || t.card,
            color: t.text,
          }}
        />
        <div
          className="mt-1 text-[12px]"
          style={{
            color: metaDescription.length > 160 ? t.gold || '#f59e0b' : t.textDim || t.textMuted,
          }}
        >
          {metaDescription.length}/160 characters{' '}
          {metaDescription.length > 160 && '— may be truncated in search results'}
        </div>
      </div>

      {/* Excerpt */}
      <div className="mb-6">
        <label
          className="mb-1.5 block text-[13px] font-semibold"
          style={{ color: t.textSecondary || t.text }}
        >
          Excerpt
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Short summary for previews and social sharing"
          rows={3}
          className="font-inherit box-border w-full resize-y rounded-lg border p-[10px_14px] text-[14px] outline-none"
          style={{
            borderColor: t.border,
            background: t.inputBg || t.card,
            color: t.text,
          }}
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !title.trim() || !content.trim()}
        className="flex items-center gap-2 rounded-[10px] border-none p-3 text-[15px] font-bold transition-all duration-200"
        style={{
          background:
            !title.trim() || !content.trim()
              ? t.border
              : `linear-gradient(135deg, ${t.accent}, #006ff9)`,
          color: !title.trim() || !content.trim() ? t.textDim || t.textMuted : '#fff',
          cursor: !title.trim() || !content.trim() ? 'not-allowed' : 'pointer',
          boxShadow: title.trim() && content.trim() ? `0 2px 12px ${t.accent}35` : 'none',
        }}
      >
        {isSubmitting ? (
          <>
            <span
              className="inline-block h-4 w-4 rounded-full border-2 border-[#FFFFFF4D] border-t-white"
              style={{ animation: 'spin 0.8s linear infinite' }}
            />
            Running Preflight Checks...
          </>
        ) : (
          '⚡ Upload & Check'
        )}
      </button>

      {/* Preflight Results */}
      {preflight && (
        <div
          style={{
            marginTop: 24,
            padding: 20,
            background: t.card,
            borderRadius: 12,
            border: `1px solid ${t.border}`,
            boxShadow: t.shadow,
          }}
        >
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: t.text }}>
            Preflight Results
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {preflight.checks.map((check, i) => {
              const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '🚫';
              const color =
                check.status === 'pass'
                  ? t.green
                  : check.status === 'warn'
                    ? t.gold || '#f59e0b'
                    : t.red || '#ef4444';
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: `${color}08`,
                    border: `1px solid ${color}20`,
                  }}
                >
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{check.name}</div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                      {check.message}
                    </div>
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
            <div
              style={{
                marginTop: 14,
                padding: '10px 14px',
                borderRadius: 8,
                background: `${t.red || '#ef4444'}10`,
                border: `1px solid ${t.red || '#ef4444'}20`,
                fontSize: 13,
                color: t.red || '#ef4444',
              }}
            >
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
