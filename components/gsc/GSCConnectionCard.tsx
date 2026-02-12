'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { gscService, GSCStatus } from '@/lib/services/api'
import { Search, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react'

interface Props {
  siteId: number | string
  onConnected?: () => void
}

export default function GSCConnectionCard({ siteId, onConnected }: Props) {
  const [status, setStatus] = useState<GSCStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStatus()
  }, [siteId])

  const loadStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await gscService.getStatus(siteId)
      setStatus(data)
    } catch (err: any) {
      console.error('Failed to load GSC status:', err)
      // Don't show error if just not connected yet
      if (!err.message?.includes('not connected')) {
        setError(err.message)
      }
      setStatus({ connected: false, gsc_site_url: null, connected_at: null })
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      setConnecting(true)
      setError(null)
      const { auth_url } = await gscService.getAuthUrl(siteId)
      // Redirect to Google OAuth
      window.location.href = auth_url
    } catch (err: any) {
      console.error('Failed to get auth URL:', err)
      setError(err.message)
      setConnecting(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (status?.connected) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Google Search Console Connected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Connected to: <span className="font-medium text-foreground">{status.gsc_site_url}</span>
          </p>
          {status.connected_at && (
            <p className="text-xs text-muted-foreground">
              Connected {new Date(status.connected_at).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
      <CardContent className="py-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="h-6 w-6 text-primary" />
          </div>
          
          <div>
            <h3 className="font-semibold text-lg">Connect to Google Search Console</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Connect your GSC to unlock powerful cannibalization detection using real search data.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-left max-w-sm mx-auto">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Search traffic insights</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Keyword rankings</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Cannibalization detection</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Click & impression data</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm justify-center">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button 
            onClick={handleConnect} 
            disabled={connecting}
            className="gap-2"
            size="lg"
          >
            {connecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Connect to Google Search Console
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
