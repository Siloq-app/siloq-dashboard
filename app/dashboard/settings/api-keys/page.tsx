'use client'

import { useState, useEffect } from 'react'
import { Key, Plus, Copy, Trash2, AlertCircle, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ApiKey {
  id: string
  name: string
  key?: string
  keyPrefix: string
  createdAt: string
  lastUsedAt?: string
  isActive: boolean
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/v1/api-keys')
      const data = await res.json()
      if (res.ok) {
        setApiKeys(data.keys)
      } else {
        setError(data.message || 'Failed to fetch API keys')
      }
    } catch (err) {
      setError('Failed to fetch API keys')
    } finally {
      setIsLoading(false)
    }
  }

  const generateKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a name for the API key')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const res = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to generate API key')
      }

      setNewlyCreatedKey(data.key)
      setNewKeyName('')
      fetchApiKeys()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const revokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/v1/api-keys/${keyId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to revoke key')
      }

      fetchApiKeys()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">API Keys</h1>
          <p className="text-slate-400">
            Manage API keys for your WordPress plugin and external integrations
          </p>
        </div>

        {/* Generate New Key Card */}
        <Card className="bg-slate-900/80 border-slate-700/50 mb-8">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Generate New API Key
            </CardTitle>
            <CardDescription className="text-slate-400">
              Create a new API key to connect your WordPress site to Siloq
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="keyName" className="text-slate-300 mb-2 block">
                  Key Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Production WordPress Site"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={generateKey}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Generate Key
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Newly Created Key Alert */}
            {newlyCreatedKey && (
              <Alert variant="warning" className="mt-6">
                <svg viewBox="0 0 20 20" fill="currentColor" data-slot="icon" aria-hidden="true" className="h-4 w-4">
                  <path d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" fillRule="evenodd"></path>
                </svg>
                <AlertTitle>Copy your API key now!</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">It won&apos;t be shown again.</p>
                  <div className="flex items-center gap-2 bg-slate-800/80 rounded-lg p-3 mt-2">
                    <code className="flex-1 text-sm text-slate-200 font-mono break-all">
                      {newlyCreatedKey.key}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => newlyCreatedKey.key && copyToClipboard(newlyCreatedKey.key, 'new')}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      {copiedId === 'new' ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Existing API Keys */}
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-100">Your API Keys</CardTitle>
            <CardDescription className="text-slate-400">
              {apiKeys.length} active key{apiKeys.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No API keys yet. Generate one above to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-200">{key.name}</span>
                        {key.isActive ? (
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 bg-slate-700 text-slate-400 rounded">
                            Revoked
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 font-mono">
                        {key.keyPrefix}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                        {key.lastUsedAt && ` • Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeKey(key.id)}
                      disabled={!key.isActive}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* WordPress Integration Info */}
        <Card className="bg-slate-900/80 border-slate-700/50 mt-8">
          <CardHeader>
            <CardTitle className="text-slate-100">WordPress Integration</CardTitle>
            <CardDescription className="text-slate-400">
              How to use your API key with the Siloq WordPress plugin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-slate-300 list-decimal list-inside">
              <li>Install the Siloq plugin from the WordPress plugin directory</li>
              <li>Go to <strong>Settings → Siloq</strong> in your WordPress admin</li>
              <li>Paste your API key in the "Siloq API Key" field</li>
              <li>Click "Connect to Siloq"</li>
              <li>Your WordPress site will now sync with your Siloq — The SEO Architect</li>
            </ol>
            <Alert variant="info" className="mt-4">
              <AlertTitle>Tip</AlertTitle>
              <AlertDescription>
                Create separate API keys for production and staging environments for better security.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
