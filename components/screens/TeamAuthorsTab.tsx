'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDashboardContext } from '@/lib/hooks/dashboard-context';
import { useToast } from '@/components/ui/use-toast';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { NoSiteSelected } from '@/components/ui/no-site-selected';
import { authorService, type AuthorProfile, type Credential, type CreateAuthorData } from '@/lib/services/api';

// ── Local camelCase type ────────────────────────────────────────────────────

interface AuthorLocal {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  credentials: Credential[];
  shortBio: string;
  longBio: string;
  linkedinUrl: string;
  twitterUrl: string;
  authorPageUrl: string;
  headshotUrl: string;
  wpUserId: number | null;
  wpUsername: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapAuthorToLocal(a: AuthorProfile): AuthorLocal {
  return {
    id: a.id,
    fullName: a.full_name,
    firstName: a.first_name,
    lastName: a.last_name,
    jobTitle: a.job_title,
    credentials: a.credentials ?? [],
    shortBio: a.short_bio,
    longBio: a.long_bio,
    linkedinUrl: a.linkedin_url,
    twitterUrl: a.twitter_url,
    authorPageUrl: a.author_page_url,
    headshotUrl: a.headshot_url,
    wpUserId: a.wp_user_id,
    wpUsername: a.wp_username,
    isPrimary: a.is_primary,
    isActive: a.is_active,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
}

// ── Common credential suggestions ───────────────────────────────────────────

const CREDENTIAL_SUGGESTIONS = [
  'NATE Certified', 'IICRC Certified', 'EPA 608', 'OSHA 10', 'OSHA 30',
  'BBB Accredited', 'GAF Certified', 'Master Electrician', 'Master Plumber',
  'General Contractor', 'REALTOR', 'CPA',
];

const CREDENTIAL_TYPES: Credential['type'][] = ['certification', 'license', 'experience', 'award'];

// ── Word counter helper ─────────────────────────────────────────────────────

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// ── Entity Signal Icon ──────────────────────────────────────────────────────

function SignalIcon({ active, label }: { active: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className={active ? 'text-green-500' : 'text-red-400'}>
        {active ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        )}
      </span>
      <span className="text-slate-500">{label}</span>
    </span>
  );
}

function WpSignalIcon({ active, label }: { active: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className={active ? 'text-green-500' : 'text-slate-300'}>
        {active ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
        )}
      </span>
      <span className="text-slate-500">{label}</span>
    </span>
  );
}

// ── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({ url, firstName, lastName, size = 'md' }: { url?: string; firstName: string; lastName: string; size?: 'sm' | 'md' }) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const px = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-14 h-14 text-lg';

  if (url) {
    return (
      <img
        src={url}
        alt={`${firstName} ${lastName}`}
        className={`${px} rounded-full object-cover border-2 border-slate-200 dark:border-slate-700`}
      />
    );
  }
  return (
    <div className={`${px} rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold flex items-center justify-center border-2 border-slate-200 dark:border-slate-700`}>
      {initials}
    </div>
  );
}

// ── Author Card ─────────────────────────────────────────────────────────────

interface AuthorCardProps {
  author: AuthorLocal;
  onEdit: () => void;
  onDelete: () => void;
  onGenerateTeamPage: () => void;
  actionLoading: number | null;
}

function AuthorCard({ author, onEdit, onDelete, onGenerateTeamPage, actionLoading }: AuthorCardProps) {
  const isLoading = actionLoading === author.id;

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
      <div className="flex gap-4">
        {/* Avatar */}
        <Avatar url={author.headshotUrl} firstName={author.firstName} lastName={author.lastName} />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{author.fullName}</span>
            {author.jobTitle && (
              <span className="text-xs text-slate-500">{author.jobTitle}</span>
            )}
            {author.isPrimary && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                Primary Author
              </span>
            )}
          </div>

          {/* Credentials */}
          {author.credentials.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {author.credentials.map((cred, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                  {cred.name}
                </span>
              ))}
            </div>
          )}

          {/* Short bio preview */}
          {author.shortBio && (
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{author.shortBio}</p>
          )}

          {/* Entity signal status */}
          <div className="flex flex-wrap gap-3">
            <SignalIcon active={!!author.linkedinUrl} label="LinkedIn" />
            <SignalIcon active={!!author.authorPageUrl} label="Team Page" />
            <WpSignalIcon active={author.wpUserId !== null} label="WP User" />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={onEdit}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onGenerateTeamPage}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Generate Team Page'}
            </button>
            <button
              onClick={onDelete}
              disabled={isLoading}
              className="px-2 py-1.5 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Credential Builder ──────────────────────────────────────────────────────

interface CredentialBuilderProps {
  credentials: Credential[];
  onChange: (creds: Credential[]) => void;
}

function CredentialBuilder({ credentials, onChange }: CredentialBuilderProps) {
  const [newType, setNewType] = useState<Credential['type']>('certification');
  const [newName, setNewName] = useState('');
  const [newYear, setNewYear] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = newName.length > 0
    ? CREDENTIAL_SUGGESTIONS.filter(s => s.toLowerCase().includes(newName.toLowerCase()))
    : CREDENTIAL_SUGGESTIONS;

  const handleAdd = () => {
    if (!newName.trim()) return;
    onChange([...credentials, { type: newType, name: newName.trim(), year: newYear || undefined }]);
    setNewName('');
    setNewYear('');
  };

  const handleRemove = (index: number) => {
    onChange(credentials.filter((_, i) => i !== index));
  };

  const typeColors: Record<string, string> = {
    certification: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    license: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    experience: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    award: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Credentials</label>

      {/* Existing credentials */}
      {credentials.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {credentials.map((cred, i) => (
            <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${typeColors[cred.type]}`}>
              <span className="opacity-60">{cred.type}</span>
              {cred.name}
              {cred.year && <span className="opacity-60">({cred.year})</span>}
              <button onClick={() => handleRemove(i)} className="ml-0.5 hover:opacity-70">&times;</button>
            </span>
          ))}
        </div>
      )}

      {/* Add row */}
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <select
            value={newType}
            onChange={e => setNewType(e.target.value as Credential['type'])}
            className="block w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            {CREDENTIAL_TYPES.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 min-w-[160px]">
          <input
            type="text"
            value={newName}
            onChange={e => { setNewName(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Credential name"
            className="block w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 top-full mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {filteredSuggestions.map(s => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={() => { setNewName(s); setShowSuggestions(false); }}
                  className="block w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="w-20">
          <input
            type="text"
            value={newYear}
            onChange={e => setNewYear(e.target.value)}
            placeholder="Year"
            maxLength={4}
            className="block w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ── Author Form Modal ───────────────────────────────────────────────────────

interface AuthorFormModalProps {
  author: AuthorLocal | null; // null = create mode
  siteUrl: string;
  onSave: (data: CreateAuthorData, authorId?: number) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

function AuthorFormModal({ author, siteUrl, onSave, onClose, saving }: AuthorFormModalProps) {
  const [firstName, setFirstName] = useState(author?.firstName ?? '');
  const [lastName, setLastName] = useState(author?.lastName ?? '');
  const [jobTitle, setJobTitle] = useState(author?.jobTitle ?? '');
  const [headshotUrl, setHeadshotUrl] = useState(author?.headshotUrl ?? '');
  const [linkedinUrl, setLinkedinUrl] = useState(author?.linkedinUrl ?? '');
  const [twitterUrl, setTwitterUrl] = useState(author?.twitterUrl ?? '');
  const [wpUserId, setWpUserId] = useState<string>(author?.wpUserId?.toString() ?? '');
  const [isPrimary, setIsPrimary] = useState(author?.isPrimary ?? false);
  const [credentials, setCredentials] = useState<Credential[]>(author?.credentials ?? []);
  const [shortBio, setShortBio] = useState(author?.shortBio ?? '');
  const [longBio, setLongBio] = useState(author?.longBio ?? '');
  const [wpVerifyStatus, setWpVerifyStatus] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle');
  const [regenLoading, setRegenLoading] = useState(false);

  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) return;
    const data: CreateAuthorData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      job_title: jobTitle.trim() || undefined,
      headshot_url: headshotUrl.trim() || undefined,
      linkedin_url: linkedinUrl.trim() || undefined,
      twitter_url: twitterUrl.trim() || undefined,
      wp_user_id: wpUserId ? parseInt(wpUserId, 10) : null,
      is_primary: isPrimary,
      credentials,
      short_bio: shortBio.trim() || undefined,
      long_bio: longBio.trim() || undefined,
    };
    await onSave(data, author?.id);
  };

  const handleVerifyWpUser = async () => {
    if (!wpUserId || !siteUrl) return;
    setWpVerifyStatus('loading');
    try {
      const cleanUrl = siteUrl.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/wp-json/wp/v2/users/${wpUserId}`);
      if (res.ok) {
        setWpVerifyStatus('ok');
      } else {
        setWpVerifyStatus('fail');
      }
    } catch {
      setWpVerifyStatus('fail');
    }
  };

  const handleRegenBios = async () => {
    if (!author) return;
    setRegenLoading(true);
    try {
      toast({ title: 'Regenerating bios...' });
      await onSave({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        job_title: jobTitle.trim() || undefined,
        credentials,
        short_bio: '',
        long_bio: '',
      }, author.id);
    } catch {
      toast({ title: 'Regen failed', variant: 'destructive' });
    } finally {
      setRegenLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {author ? 'Edit Author' : 'Add Author'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Job Title</label>
            <input
              type="text"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Headshot URL</label>
            <input
              type="url"
              value={headshotUrl}
              onChange={e => setHeadshotUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 block w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">LinkedIn URL</label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={e => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="mt-1 block w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Twitter URL</label>
            <input
              type="url"
              value={twitterUrl}
              onChange={e => setTwitterUrl(e.target.value)}
              placeholder="https://twitter.com/..."
              className="mt-1 block w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            />
          </div>

          {/* WP User ID */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">WordPress User ID</label>
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                value={wpUserId}
                onChange={e => { setWpUserId(e.target.value); setWpVerifyStatus('idle'); }}
                placeholder="e.g. 2"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              />
              <button
                onClick={handleVerifyWpUser}
                disabled={!wpUserId || wpVerifyStatus === 'loading'}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
              >
                {wpVerifyStatus === 'loading' ? 'Checking...' : 'Verify'}
              </button>
              {wpVerifyStatus === 'ok' && <span className="text-green-500 self-center text-sm">Found</span>}
              {wpVerifyStatus === 'fail' && <span className="text-red-500 self-center text-sm">Not found</span>}
            </div>
          </div>

          {/* Primary toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isPrimary}
              onClick={() => setIsPrimary(!isPrimary)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPrimary ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPrimary ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Primary Author</span>
          </div>

          {/* Credential Builder */}
          <CredentialBuilder credentials={credentials} onChange={setCredentials} />

          {/* Bios */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Short Bio</label>
              <span className={`text-xs ${wordCount(shortBio) >= 50 && wordCount(shortBio) <= 80 ? 'text-green-500' : 'text-slate-400'}`}>
                {wordCount(shortBio)} words (target 50-80)
              </span>
            </div>
            <textarea
              value={shortBio}
              onChange={e => setShortBio(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Long Bio</label>
              <span className={`text-xs ${wordCount(longBio) >= 150 && wordCount(longBio) <= 200 ? 'text-green-500' : 'text-slate-400'}`}>
                {wordCount(longBio)} words (target 150-200)
              </span>
            </div>
            <textarea
              value={longBio}
              onChange={e => setLongBio(e.target.value)}
              rows={5}
              className="mt-1 block w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 resize-none"
            />
          </div>

          {author && (
            <button
              onClick={handleRegenBios}
              disabled={regenLoading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50"
            >
              {regenLoading ? 'Regenerating...' : 'Regenerate Bios'}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !firstName.trim() || !lastName.trim()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : author ? 'Update Author' : 'Add Author'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function TeamAuthorsTab() {
  const { selectedSite } = useDashboardContext();
  const { toast } = useToast();

  const [authors, setAuthors] = useState<AuthorLocal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<AuthorLocal | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Load authors ────────────────────────────────────────────────────────────

  const loadAuthors = useCallback(async () => {
    if (!selectedSite) return;
    setLoading(true);
    setError(null);
    try {
      const data = await authorService.listAuthors(selectedSite.id);
      setAuthors(data.map(mapAuthorToLocal));
    } catch (err: any) {
      setError(err?.message || 'Failed to load authors');
    } finally {
      setLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => {
    loadAuthors();
  }, [loadAuthors]);

  // ── Save (create/update) ──────────────────────────────────────────────────

  const handleSave = async (data: CreateAuthorData, authorId?: number) => {
    if (!selectedSite) return;
    setSaving(true);
    try {
      if (authorId) {
        await authorService.updateAuthor(selectedSite.id, authorId, data as any);
        toast({ title: 'Author updated' });
      } else {
        await authorService.createAuthor(selectedSite.id, data);
        toast({ title: 'Author added' });
      }
      await loadAuthors();
      setFormOpen(false);
      setEditingAuthor(null);
    } catch (err: any) {
      toast({ title: authorId ? 'Update failed' : 'Create failed', description: err?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (author: AuthorLocal) => {
    if (!selectedSite) return;
    setActionLoading(author.id);
    try {
      await authorService.deleteAuthor(selectedSite.id, author.id);
      setAuthors(prev => prev.filter(a => a.id !== author.id));
      toast({ title: `"${author.fullName}" deleted` });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err?.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  // ── Generate Team Page ────────────────────────────────────────────────────

  const handleGenerateTeamPage = async (author: AuthorLocal) => {
    if (!selectedSite) return;
    setActionLoading(author.id);
    try {
      const result = await authorService.generateTeamPage(selectedSite.id, author.id);
      toast({ title: `Team page generated for ${author.fullName}`, description: `WP Page ID: ${result.wp_page_id}` });
      await loadAuthors();
    } catch (err: any) {
      toast({ title: 'Generate failed', description: err?.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────

  if (!selectedSite) {
    return <NoSiteSelected message="Select a site to manage your team and authors." />;
  }

  if (loading && authors.length === 0) {
    return <LoadingState message="Loading authors..." />;
  }

  if (error && authors.length === 0) {
    return <ErrorState message={error} onRetry={loadAuthors} />;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Team &amp; Authors</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage author profiles for E-E-A-T signals &mdash; credentials, bios, and entity linking.
          </p>
        </div>
        <button
          onClick={() => { setEditingAuthor(null); setFormOpen(true); }}
          className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Author
        </button>
      </div>

      {/* Author Cards */}
      {authors.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No authors yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md">
              Add your first author to start building E-E-A-T entity signals for your content.
            </p>
          </div>
          <button
            onClick={() => { setEditingAuthor(null); setFormOpen(true); }}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Add Author
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {authors.map(author => (
            <AuthorCard
              key={author.id}
              author={author}
              onEdit={() => { setEditingAuthor(author); setFormOpen(true); }}
              onDelete={() => handleDelete(author)}
              onGenerateTeamPage={() => handleGenerateTeamPage(author)}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {formOpen && (
        <AuthorFormModal
          author={editingAuthor}
          siteUrl={selectedSite.url}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditingAuthor(null); }}
          saving={saving}
        />
      )}
    </div>
  );
}
