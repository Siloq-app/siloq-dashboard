'use client';

import { useState, useEffect } from 'react';
import {
  Check,
  Copy,
  Plus,
  Trash2,
  User,
  Key,
  Users,
  Shield,
  Bell,
  Mail,
  UserCircle,
  Link as LinkIcon,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AutomationMode } from '@/app/dashboard/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { fetchWithAuth } from '@/lib/auth-headers';
import { toast } from 'sonner';
import { SubscriptionTier, TIER_CONFIGS } from '@/lib/billing/types';

type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: 'active' | 'pending';
  avatar: string;
  color: string;
}

interface Props {
  automationMode?: AutomationMode;
  onAutomationChange?: (mode: AutomationMode) => void;
  onNavigateToSites?: () => void;
  currentTier?: SubscriptionTier;
}

const automationModes = [
  {
    id: 'manual' as const,
    label: 'Manual',
    desc: 'All changes require explicit approval before execution',
    color: 'slate' as const,
  },
  {
    id: 'semi' as const,
    label: 'Semi-Auto',
    desc: 'Safe changes auto-execute immediately. Destructive changes require explicit approval.',
    color: 'amber' as const,
  },
  {
    id: 'full' as const,
    label: 'Full-Auto',
    desc: 'All changes auto-execute immediately. 48-hour rollback window on destructive changes. Daily digest email notification.',
    color: 'emerald' as const,
  },
];

type TabId =
  | 'profile'
  | 'api-keys'
  | 'team'
  | 'agent-permissions'
  | 'notifications';

const tabs = [
  { id: 'profile' as const, label: 'Profile', icon: User },
  { id: 'api-keys' as const, label: 'API Keys', icon: Key },
  { id: 'team' as const, label: 'Team', icon: Users },
  {
    id: 'agent-permissions' as const,
    label: 'Agent Permissions',
    icon: Shield,
  },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
];

export default function Settings({
  automationMode,
  onAutomationChange,
  onNavigateToSites,
  currentTier = 'free_trial',
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Team state
  const tierConfig = TIER_CONFIGS[currentTier];
  const maxTeammates = tierConfig.maxTeammates;
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('viewer');
  const [isInviting, setIsInviting] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  // Fetch team members
  // Bug fix: Wrap in try/catch to gracefully fail so profile tab still works
  useEffect(() => {
    async function fetchTeam() {
      try {
        const res = await fetchWithAuth('/api/v1/auth/team/');
        if (res.ok) {
          const data = await res.json();
          if (data.team_members && Array.isArray(data.team_members)) {
            setTeamMembers(data.team_members);
          }
        } else {
          // Team endpoint might 404 if migration 0003 tables don't exist
          // Set empty array so UI still renders
          setTeamMembers([]);
        }
      } catch (err) {
        // Gracefully fail - set empty team members array
        console.warn('Team fetch failed (tables may not exist yet):', err);
        setTeamMembers([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTeam();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setTeamError(null);

    // Check limit
    const nonOwnerCount = teamMembers.filter(m => m.role !== 'owner').length;
    if (nonOwnerCount >= maxTeammates) {
      setTeamError(`You've reached the teammate limit for your ${tierConfig.name} plan. Upgrade to add more.`);
      setIsInviting(false);
      return;
    }

    try {
      const res = await fetchWithAuth('/api/v1/auth/team/invite/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) {
        const data = await res.json();
        const initials = inviteEmail.substring(0, 2).toUpperCase();
        const colors = ['indigo', 'rose', 'amber', 'emerald', 'purple', 'cyan'];
        setTeamMembers(prev => [...prev, {
          id: Date.now().toString(),
          name: inviteEmail.split('@')[0],
          email: inviteEmail,
          role: inviteRole,
          status: 'pending',
          avatar: initials,
          color: colors[prev.length % colors.length],
        }]);
        setInviteEmail('');
        setShowInviteForm(false);
      } else {
        // Bug fix: Show user-friendly error if endpoint fails
        setTeamError('Unable to send invite. Team features may not be available yet. Please try again later.');
      }
    } catch (err) {
      // Bug fix: Graceful error handling
      console.error('Invite error:', err);
      setTeamError('Unable to send invite. Team features may not be available yet. Please try again later.');
    } finally {
      setIsInviting(false);
    }
  };

  const [apiKeys, setApiKeys] = useState<{
    id: string;
    name: string;
    key: string;
    created: string;
    lastUsed: string;
  }[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [newKeyName, setNewKeyName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
  });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load initial data from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetchWithAuth('/api/v1/settings/');
        if (response.ok) {
          const data = await response.json();
          setProfile({
            name: data.name || '',
            email: data.email || '',
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load settings. Please refresh and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  };

  const handleDeleteKey = (id: string) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id));
  };

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) return;

    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: 'sk_live_' + Math.random().toString(36).substring(2, 20),
      created: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      lastUsed: 'Never',
    };

    setApiKeys([newKey, ...apiKeys]);
    setNewKeyName('');
    setIsGenerating(false);
  };

  const maskKey = (key: string) => {
    return key.substring(0, 10) + '•'.repeat(key.length - 10);
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const validateProfile = () => {
    const newErrors: { name?: string; email?: string } = {};

    if (!profile.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!profile.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetchWithAuth('/api/v1/auth/me/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save profile');
      }

      toast.success('Profile saved successfully');
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Profile Settings
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Update your personal information
        </p>
      </div>

      <div className="space-y-4">
        <div className="FieldGroup space-y-4">
          <div className="Field space-y-2">
            <label
              htmlFor="name"
              className="FieldLabel text-sm font-medium text-slate-900 dark:text-slate-100"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={profile.name}
              onChange={(e) => {
                setProfile({ ...profile, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              placeholder="Your name"
              className={`border-input file:text-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 ${
                errors.name ? 'border-red-500' : ''
              }`}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="Field space-y-2">
            <label
              htmlFor="email"
              className="FieldLabel text-sm font-medium text-slate-900 dark:text-slate-100"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => {
                setProfile({ ...profile, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              placeholder="your@email.com"
              className={`border-input file:text-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 ${
                errors.email ? 'border-red-500' : ''
              }`}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
          <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm text-emerald-700 dark:text-emerald-400">
            Profile saved successfully!
          </span>
        </div>
      )}

      <button
        onClick={handleSaveProfile}
        disabled={isSaving}
        className="focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
      >
        {isSaving ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Saving...
          </>
        ) : (
          <>
            Save Changes
            <Check size={16} />
          </>
        )}
      </button>
    </div>
  );

  const renderApiKeysTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          API Keys for WordPress
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage sites and generate API keys per site (like GitHub tokens). Use
          the Siloq plugin with each key.
        </p>
      </div>

      <Card className="border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-950/20">
        <div className="flex flex-col gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <Key className="text-indigo-600 dark:text-indigo-400" size={20} />
          </div>
          <div className="flex-1">
            <p className="mb-4 text-sm text-indigo-900 dark:text-indigo-300">
              Add WordPress sites in <strong>Sites</strong>, then create a token
              for each site. Paste the token and API URL in your WordPress
              plugin (Settings → Siloq).
            </p>
            {onNavigateToSites ? (
              <button
                onClick={onNavigateToSites}
                className="focus-visible:ring-ring inline-flex h-9 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white shadow transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 sm:w-auto sm:px-4 sm:text-sm [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              >
                <LinkIcon size={16} />
                <span className="truncate">Manage sites & API keys</span>
              </button>
            ) : (
              <p className="text-sm text-indigo-700 dark:text-indigo-400">
                Go to <strong>Sites</strong> in the sidebar to manage sites and
                API keys.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Plugin download & how to use */}
      <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
        <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          Download &amp; Setup:
        </h4>
        <div className="mb-4">
          <a
            href="https://github.com/Siloq-app/siloq-wordpress/releases/download/v1.5.3/siloq-connector.zip"
            download
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700"
          >
            <Key size={16} />
            Download Siloq Plugin (.zip)
          </a>
        </div>
        <ol className="list-inside list-decimal space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li>
            Go to <strong>Sites</strong> and add your WordPress site
          </li>
          <li>Generate a token for that site and copy it</li>
          <li>Download and install the Siloq WordPress plugin (above)</li>
          <li>Go to WordPress Admin &gt; Settings &gt; Siloq</li>
          <li>Enter your API key and click &quot;Test Connection&quot;</li>
          <li>Sync your pages</li>
        </ol>
      </div>
    </div>
  );

  const renderTeamTab = () => {
    const nonOwnerCount = teamMembers.filter(m => m.role !== 'owner').length;
    const atLimit = nonOwnerCount >= maxTeammates;
    const avatarColors: Record<string, string> = {
      indigo: 'bg-indigo-600 dark:bg-indigo-500',
      rose: 'bg-rose-600 dark:bg-rose-500',
      amber: 'bg-amber-600 dark:bg-amber-500',
      emerald: 'bg-emerald-600 dark:bg-emerald-500',
      purple: 'bg-purple-600 dark:bg-purple-500',
      cyan: 'bg-cyan-600 dark:bg-cyan-500',
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Team Members
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {currentTier === 'free_trial'
                ? 'Upgrade to Pro to add teammates'
                : `${nonOwnerCount}/${maxTeammates} teammates`}
            </p>
          </div>
          {currentTier !== 'free_trial' && (
            <button
              onClick={() => setShowInviteForm(true)}
              disabled={atLimit}
              className="focus-visible:ring-ring inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
            >
              Invite Member <Plus size={16} />
            </button>
          )}
        </div>

        {currentTier === 'free_trial' && (
          <Card className="border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/20">
            <div className="flex items-center gap-3">
              <Users className="text-amber-600 dark:text-amber-400" size={20} />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
                  Upgrade to Pro to add teammates
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Team collaboration starts at the Pro plan ($199/mo) with 1 teammate.
                </p>
              </div>
            </div>
          </Card>
        )}

        {atLimit && currentTier !== 'free_trial' && (
          <Card className="border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              You&apos;ve reached the {maxTeammates} teammate limit for {tierConfig.name}.{' '}
              <a href="/dashboard/settings/subscription" className="font-medium underline">
                Upgrade your plan
              </a>{' '}
              to add more.
            </p>
          </Card>
        )}

        {teamError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {teamError}
          </div>
        )}

        {showInviteForm && (
          <Card className="border-slate-200 p-4 dark:border-slate-700">
            <h4 className="mb-3 text-sm font-medium text-slate-900 dark:text-slate-100">
              Invite a teammate
            </h4>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex h-9 flex-1 rounded-md border border-slate-200 bg-transparent px-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 dark:border-slate-700"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                className="h-9 rounded-md border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={handleInvite}
                disabled={isInviting || !inviteEmail.trim()}
                className="inline-flex h-9 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {isInviting ? 'Sending...' : 'Send Invite'}
              </button>
              <button
                onClick={() => setShowInviteForm(false)}
                className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          {teamMembers.length === 0 && currentTier !== 'free_trial' && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No team members yet. Invite someone to get started.
            </p>
          )}
          {teamMembers.map((member) => (
            <Card
              key={member.id}
              className="bg-card flex flex-col justify-between gap-3 border-slate-200 p-4 sm:flex-row sm:items-center dark:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold text-white ${avatarColors[member.color] || 'bg-slate-600'}`}
                >
                  {member.avatar}
                </div>
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100">
                    {member.name}
                    {member.status === 'pending' && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="truncate text-sm text-slate-500 dark:text-slate-400">
                    {member.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:ml-auto">
                <span className="text-sm capitalize text-slate-500 dark:text-slate-400">
                  {member.role}
                </span>
                {member.role !== 'owner' && (
                  <button className="focus-visible:ring-ring inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800">
                    Edit
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderAgentPermissionsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Agent Permissions
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure what automated agents can and cannot do
        </p>
      </div>

      <div>
        <h4 className="mb-4 text-sm font-medium text-slate-900 dark:text-slate-100">
          Automation Mode
        </h4>
        <div className="space-y-3">
          {automationModes.map((mode) => {
            const isSelected = automationMode === mode.id;
            const getModeColors = (color: string, selected: boolean) => {
              const colors: Record<
                string,
                { border: string; bg: string; label: string; check: string }
              > = {
                slate: {
                  border: selected
                    ? 'border-slate-600 dark:border-slate-400'
                    : 'border-slate-200 dark:border-slate-700',
                  bg: selected ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-card',
                  label: 'text-slate-700 dark:text-slate-300',
                  check: 'bg-slate-600 dark:bg-slate-400',
                },
                amber: {
                  border: selected
                    ? 'border-amber-500 dark:border-amber-400'
                    : 'border-slate-200 dark:border-slate-700',
                  bg: selected ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-card',
                  label: 'text-amber-700 dark:text-amber-400',
                  check: 'bg-amber-500 dark:bg-amber-400',
                },
                emerald: {
                  border: selected
                    ? 'border-emerald-500 dark:border-emerald-400'
                    : 'border-slate-200 dark:border-slate-700',
                  bg: selected
                    ? 'bg-emerald-50 dark:bg-emerald-950/30'
                    : 'bg-card',
                  label: 'text-emerald-700 dark:text-emerald-400',
                  check: 'bg-emerald-500 dark:bg-emerald-400',
                },
              };
              return colors[color] || colors.slate;
            };
            const modeColors = getModeColors(mode.color, isSelected);
            return (
              <Card
                key={mode.id}
                onClick={() => onAutomationChange?.(mode.id)}
                className={`cursor-pointer border p-5 transition-all ${modeColors.border} ${modeColors.bg} hover:border-slate-300 dark:hover:border-slate-600`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        mode.color === 'slate'
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          : mode.color === 'amber'
                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}
                    >
                      {mode.color === 'slate' && <Shield size={16} />}
                      {mode.color === 'amber' && <Bell size={16} />}
                      {mode.color === 'emerald' && <Check size={16} />}
                    </div>
                    <div>
                      <div
                        className={`truncate text-sm font-medium ${isSelected ? modeColors.label : 'text-slate-900 dark:text-slate-100'}`}
                      >
                        {mode.label}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {mode.desc}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${modeColors.check}`}
                    >
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="mb-4 text-sm font-medium text-slate-900 dark:text-slate-100">
          Fine-grained Permissions
        </h4>
        <div className="space-y-3">
          {[
            {
              label: 'Allow content generation',
              desc: 'Agents can create new content blocks',
              enabled: true,
            },
            {
              label: 'Allow internal linking',
              desc: 'Agents can add internal links between pages',
              enabled: true,
            },
            {
              label: 'Allow meta tag updates',
              desc: 'Agents can modify title and description tags',
              enabled: true,
            },
            {
              label: 'Allow URL redirects',
              desc: 'Agents can create 301 redirects',
              enabled: false,
            },
            {
              label: 'Allow page deletion',
              desc: 'Agents can delete or archive pages',
              enabled: false,
            },
            {
              label: 'Allow schema markup changes',
              desc: 'Agents can modify structured data',
              enabled: true,
            },
          ].map((perm, i) => (
            <div
              key={i}
              className="bg-card flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:p-4 dark:border-slate-700"
            >
              <div>
                <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {perm.label}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {perm.desc}
                </div>
              </div>
              <div
                className={`h-6 w-10 cursor-pointer rounded-full p-1 transition-colors ${
                  perm.enabled
                    ? 'bg-emerald-500'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-white transition-transform ${
                    perm.enabled ? 'translate-x-4' : ''
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card className="bg-card border-slate-200 p-5 dark:border-slate-700">
        <h4 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
          Change Classification Reference
        </h4>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ SAFE (can auto-approve)
            </div>
            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <div>• Internal link additions</div>
              <div>• Entity assignments</div>
              <div>• New content generation</div>
              <div>• Anchor text optimization</div>
              <div>• Schema markup updates</div>
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold text-red-600 dark:text-red-400">
              ⚠ DESTRUCTIVE (approval required)
            </div>
            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <div>• URL redirects (301s)</div>
              <div>• Page deletions/archival</div>
              <div>• Content merges</div>
              <div>• Keyword reassignment</div>
              <div>• Silo restructuring</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Notification Preferences
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Choose how and when you want to be notified
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
          Email Notifications
        </h4>
        {[
          {
            label: 'Daily digest email',
            desc: 'Summary of all changes made by agents (Full-Auto mode)',
            checked: true,
          },
          {
            label: 'Immediate alerts for BLOCK errors',
            desc: 'Critical issues that require immediate attention',
            checked: true,
          },
          {
            label: 'Weekly governance report',
            desc: 'Comprehensive report on site health and recommendations',
            checked: false,
          },
          {
            label: 'Team member activity',
            desc: 'Notifications when team members make changes',
            checked: false,
          },
          {
            label: 'New approval requests',
            desc: 'Alert when destructive changes need approval',
            checked: true,
          },
        ].map((pref, i) => (
          <div
            key={i}
            className="bg-card flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:p-4 dark:border-slate-700"
          >
            <div>
              <div className="mb-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {pref.label}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {pref.desc}
              </div>
            </div>
            <div
              className={`h-6 w-10 cursor-pointer rounded-full p-1 transition-colors ${
                pref.checked
                  ? 'bg-emerald-500'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-white transition-transform ${
                  pref.checked ? 'translate-x-4' : ''
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700">
        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
          In-App Notifications
        </h4>
        {[
          {
            label: 'Show toast notifications',
            desc: 'Display brief popup notifications for important events',
            checked: true,
          },
          {
            label: 'Play sound alerts',
            desc: 'Audio notification for critical alerts',
            checked: false,
          },
          {
            label: 'Browser push notifications',
            desc: 'Allow notifications when app is not in focus',
            checked: false,
          },
        ].map((pref, i) => (
          <div
            key={i}
            className="bg-card flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:p-4 dark:border-slate-700"
          >
            <div>
              <div className="mb-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {pref.label}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {pref.desc}
              </div>
            </div>
            <div
              className={`h-6 w-10 cursor-pointer rounded-full p-1 transition-colors ${
                pref.checked
                  ? 'bg-emerald-500'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-white transition-transform ${
                  pref.checked ? 'translate-x-4' : ''
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <Mail
            className="shrink-0 text-slate-600 dark:text-slate-400"
            size={20}
          />
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-medium">Primary email:</span>{' '}
            john.doe@company.com
          </div>
        </div>
        <button className="focus-visible:ring-ring inline-flex h-9 w-fit items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 md:ml-auto dark:text-slate-300 dark:hover:bg-slate-700">
          Change
        </button>
      </div>
    </div>
  );

  const tabContent = {
    profile: renderProfileTab,
    'api-keys': renderApiKeysTab,
    team: renderTeamTab,
    'agent-permissions': renderAgentPermissionsTab,
    notifications: renderNotificationsTab,
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
        Settings
      </h3>

      <div className="border-border border-b">
        <div className="scrollbar-hide flex gap-1 overflow-x-auto lg:overflow-visible">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors lg:flex-none lg:justify-start lg:px-4 ${
                  activeTab === tab.id
                    ? 'border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <Icon size={16} />
                <span className="hidden lg:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Card className="bg-card border-border p-4 sm:p-6">
        {tabContent[activeTab]()}
      </Card>
    </div>
  );
}
