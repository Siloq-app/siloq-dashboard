'use client'

import { useState } from 'react'
import { Check, Copy, Plus, Trash2, User, Key, Users, Shield, Bell, Mail, UserCircle, Link as LinkIcon, Eye, EyeOff } from 'lucide-react'
import { AutomationMode } from '../Dashboard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Props {
  automationMode?: AutomationMode
  onAutomationChange?: (mode: AutomationMode) => void
  onNavigateToSites?: () => void
}

const automationModes = [
  { 
    id: 'manual' as const, 
    label: 'Manual', 
    desc: 'All changes require explicit approval before execution' 
  },
  { 
    id: 'semi' as const, 
    label: 'Semi-Auto', 
    desc: 'Safe changes auto-execute immediately. Destructive changes require explicit approval.' 
  },
  { 
    id: 'full' as const, 
    label: 'Full-Auto', 
    desc: 'All changes auto-execute immediately. 48-hour rollback window on destructive changes. Daily digest email notification.' 
  },
]

type TabId = 'profile' | 'api-keys' | 'team' | 'agent-permissions' | 'notifications'

const tabs = [
  { id: 'profile' as const, label: 'Profile', icon: User },
  { id: 'api-keys' as const, label: 'API Keys', icon: Key },
  { id: 'team' as const, label: 'Team', icon: Users },
  { id: 'agent-permissions' as const, label: 'Agent Permissions', icon: Shield },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
]

export default function Settings({ automationMode, onAutomationChange, onNavigateToSites }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const [apiKeys, setApiKeys] = useState([
    { id: '1', name: 'Production Site', key: 'prod_key_placeholder_abc123xyz', created: 'Jan 30, 2026', lastUsed: 'Feb 6, 2026' },
    { id: '2', name: 'Staging Site', key: 'dev_key_placeholder_def456uvw', created: 'Jan 15, 2026', lastUsed: 'Feb 5, 2026' },
  ])
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [newKeyName, setNewKeyName] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(id)) {
      newVisible.delete(id)
    } else {
      newVisible.add(id)
    }
    setVisibleKeys(newVisible)
  }

  const handleDeleteKey = (id: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== id))
  }

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) return
    
    setIsGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: 'sk_live_' + Math.random().toString(36).substring(2, 20),
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastUsed: 'Never'
    }
    
    setApiKeys([newKey, ...apiKeys])
    setNewKeyName('')
    setIsGenerating(false)
  }

  const maskKey = (key: string) => {
    return key.substring(0, 10) + '•'.repeat(key.length - 10)
  }

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@company.com',
  })
  const [errors, setErrors] = useState<{name?: string; email?: string}>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const validateProfile = () => {
    const newErrors: {name?: string; email?: string} = {}
    
    if (!profile.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (!profile.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveProfile = async () => {
    if (!validateProfile()) return
    
    setIsSaving(true)
    setSaveSuccess(false)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSaving(false)
    setSaveSuccess(true)
    
    // Hide success message after 3 seconds
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Profile Settings</h3>
        <p className="text-sm text-muted-foreground">Update your personal information</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Name <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            value={profile.name}
            onChange={(e) => {
              setProfile({...profile, name: e.target.value})
              if (errors.name) setErrors({...errors, name: undefined})
            }}
            placeholder="Your name"
            className={`w-full px-4 py-2.5 rounded-lg border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563eb] transition-colors ${
              errors.name ? 'border-red-500' : 'border-border'
            }`}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Email <span className="text-red-500">*</span>
          </label>
          <input 
            type="email" 
            value={profile.email}
            onChange={(e) => {
              setProfile({...profile, email: e.target.value})
              if (errors.email) setErrors({...errors, email: undefined})
            }}
            placeholder="your@email.com"
            className={`w-full px-4 py-2.5 rounded-lg border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563eb] transition-colors ${
              errors.email ? 'border-red-500' : 'border-border'
            }`}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <Check size={16} className="text-emerald-500" />
          <span className="text-sm text-emerald-500">Profile saved successfully!</span>
        </div>
      )}

      <Button 
        onClick={handleSaveProfile}
        disabled={isSaving}
        className="flex items-center gap-2"
      >
        {isSaving ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Check size={16} />
            Save Changes
          </>
        )}
      </Button>
    </div>
  )

  const renderApiKeysTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">API Keys for WordPress</h3>
        <p className="text-sm text-muted-foreground">
          Manage sites and generate API keys per site (like GitHub tokens). Use the Siloq plugin with each key.
        </p>
      </div>

      <Card className="p-6 bg-white">
        <p className="text-sm text-muted-foreground mb-4">
          Add WordPress sites in <strong>Sites</strong>, then create a token for each site. Paste the token and API URL in your WordPress plugin (Settings → Siloq).
        </p>
        {onNavigateToSites ? (
          <Button onClick={onNavigateToSites} className="flex items-center gap-2">
            <LinkIcon size={16} />
            Manage sites & API keys
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Go to <strong>Sites</strong> in the sidebar to manage sites and API keys.</p>
        )}
      </Card>

      {/* How to use */}
      <div className="pt-4 border-t border-border">
        <h4 className="text-sm font-semibold text-foreground mb-3">How to use:</h4>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li>Go to <strong>Sites</strong> and add your WordPress site</li>
          <li>Generate a token for that site and copy it</li>
          <li>Install the Siloq WordPress plugin on your site</li>
          <li>Go to WordPress Admin &gt; Settings &gt; Siloq</li>
          <li>Enter your API key and save</li>
          <li>Click "Test Connection" to verify</li>
        </ol>
      </div>
    </div>
  )

  const renderTeamTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Team Members</h3>
          <p className="text-sm text-muted-foreground">Manage team access and permissions</p>
        </div>
        <Button><Plus size={16} /> Invite Member</Button>
      </div>

      <div className="space-y-3">
        {[
          { name: 'John Doe', email: 'john.doe@company.com', role: 'Administrator', status: 'active', avatar: 'JD' },
          { name: 'Sarah Smith', email: 'sarah.smith@company.com', role: 'Editor', status: 'active', avatar: 'SS' },
          { name: 'Mike Johnson', email: 'mike.j@company.com', role: 'Viewer', status: 'pending', avatar: 'MJ' },
          { name: 'Emily Chen', email: 'emily.chen@company.com', role: 'Editor', status: 'active', avatar: 'EC' },
        ].map((member, i) => (
          <Card key={i} className="p-4 flex items-center justify-between bg-[#F0F1F3]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2563eb] rounded-full flex items-center justify-center text-white font-semibold">
                {member.avatar}
              </div>
              <div>
                <div className="font-medium flex items-center gap-2">
                  {member.name}
                  {member.status === 'pending' && (
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Pending</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{member.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{member.role}</span>
              <Button variant="ghost" size="sm">Edit</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderAgentPermissionsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Agent Permissions</h3>
        <p className="text-sm text-muted-foreground">Configure what automated agents can and cannot do</p>
      </div>

      <div>
        <h4 className="text-base font-semibold mb-4">Automation Mode</h4>
        <div className="space-y-3">
          {automationModes.map((mode) => (
            <Card
              key={mode.id}
              onClick={() => onAutomationChange(mode.id)}
              className={`p-5 cursor-pointer transition-all ${
                automationMode === mode.id
                  ? 'border-[#2563eb] bg-[#2563eb]/5'
                  : 'border-border bg-[#F0F1F3] hover:border-[#2563eb]/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold mb-1">{mode.label}</div>
                  <div className="text-sm text-muted-foreground">{mode.desc}</div>
                </div>
                {automationMode === mode.id && (
                  <div className="w-6 h-6 bg-[#2563eb] rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-base font-semibold mb-4">Fine-grained Permissions</h4>
        <div className="space-y-3">
          {[
            { label: 'Allow content generation', desc: 'Agents can create new content blocks', enabled: true },
            { label: 'Allow internal linking', desc: 'Agents can add internal links between pages', enabled: true },
            { label: 'Allow meta tag updates', desc: 'Agents can modify title and description tags', enabled: true },
            { label: 'Allow URL redirects', desc: 'Agents can create 301 redirects', enabled: false },
            { label: 'Allow page deletion', desc: 'Agents can delete or archive pages', enabled: false },
            { label: 'Allow schema markup changes', desc: 'Agents can modify structured data', enabled: true },
          ].map((perm, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-[#F0F1F3] rounded-lg border border-border"
            >
              <div>
                <div className="font-medium">{perm.label}</div>
                <div className="text-sm text-muted-foreground">{perm.desc}</div>
              </div>
              <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                perm.enabled ? 'bg-[#2563eb]' : 'bg-slate-300'
              }`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  perm.enabled ? 'translate-x-4' : ''
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card className="p-5 bg-[#F0F1F3] border-border">
        <h4 className="text-sm font-semibold mb-4">Change Classification Reference</h4>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-xs text-emerald-600 font-semibold mb-2">✓ SAFE (can auto-approve)</div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>• Internal link additions</div>
              <div>• Entity assignments</div>
              <div>• New content generation</div>
              <div>• Anchor text optimization</div>
              <div>• Schema markup updates</div>
            </div>
          </div>
          <div>
            <div className="text-xs text-red-600 font-semibold mb-2">⚠ DESTRUCTIVE (approval required)</div>
            <div className="text-sm text-muted-foreground space-y-1">
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
  )

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Notification Preferences</h3>
        <p className="text-sm text-muted-foreground">Choose how and when you want to be notified</p>
      </div>

      <div className="space-y-4">
        <h4 className="text-base font-semibold">Email Notifications</h4>
        {[
          { label: 'Daily digest email', desc: 'Summary of all changes made by agents (Full-Auto mode)', checked: true },
          { label: 'Immediate alerts for BLOCK errors', desc: 'Critical issues that require immediate attention', checked: true },
          { label: 'Weekly governance report', desc: 'Comprehensive report on site health and recommendations', checked: false },
          { label: 'Team member activity', desc: 'Notifications when team members make changes', checked: false },
          { label: 'New approval requests', desc: 'Alert when destructive changes need approval', checked: true },
        ].map((pref, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 bg-[#F0F1F3] rounded-lg border border-border"
          >
            <div>
              <div className="font-medium">{pref.label}</div>
              <div className="text-sm text-muted-foreground">{pref.desc}</div>
            </div>
            <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${
              pref.checked ? 'bg-[#2563eb]' : 'bg-slate-300'
            }`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                pref.checked ? 'translate-x-4' : ''
              }`} />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        <h4 className="text-base font-semibold">In-App Notifications</h4>
        {[
          { label: 'Show toast notifications', desc: 'Display brief popup notifications for important events', checked: true },
          { label: 'Play sound alerts', desc: 'Audio notification for critical alerts', checked: false },
          { label: 'Browser push notifications', desc: 'Allow notifications when app is not in focus', checked: false },
        ].map((pref, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 bg-[#F0F1F3] rounded-lg border border-border"
          >
            <div>
              <div className="font-medium">{pref.label}</div>
              <div className="text-sm text-muted-foreground">{pref.desc}</div>
            </div>
            <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${
              pref.checked ? 'bg-[#2563eb]' : 'bg-slate-300'
            }`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                pref.checked ? 'translate-x-4' : ''
              }`} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 p-4 bg-[#2563eb]/5 rounded-lg border border-[#2563eb]/20">
        <Mail className="text-[#2563eb]" size={20} />
        <div className="text-sm">
          <span className="font-medium">Primary email:</span> john.doe@company.com
        </div>
        <Button variant="ghost" size="sm" className="ml-auto">Change</Button>
      </div>
    </div>
  )

  const tabContent = {
    'profile': renderProfileTab,
    'api-keys': renderApiKeysTab,
    'team': renderTeamTab,
    'agent-permissions': renderAgentPermissionsTab,
    'notifications': renderNotificationsTab,
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Settings</h2>

      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-[#2563eb] text-[#2563eb]'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <Card className="p-6 bg-[#F0F1F3] border-border">
        {tabContent[activeTab]()}
      </Card>
    </div>
  )
}
