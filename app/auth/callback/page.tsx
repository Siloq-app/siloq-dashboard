'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Check, AlertCircle } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processing authentication...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const error = searchParams.get('error')
        if (error) {
          setStatus('error')
          setMessage(error)
          setTimeout(() => router.push('/auth/login'), 3000)
          return
        }

        const token = searchParams.get('token')
        const email = searchParams.get('email')
        const name = searchParams.get('name')

        if (token) {
          localStorage.setItem('token', token)
          if (email) localStorage.setItem('userEmail', email)
          if (name) localStorage.setItem('userName', name)

          setStatus('success')
          setMessage('Authentication successful! Redirecting...')
          setTimeout(() => router.push('/dashboard'), 1500)
        } else {
          const code = searchParams.get('code')
          if (code) {
            const res = await fetch('/api/v1/auth/google/callback/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code })
            })

            const data = await res.json()

            if (res.ok && data.token) {
              localStorage.setItem('token', data.token)
              if (data.user?.email) localStorage.setItem('userEmail', data.user.email)
              if (data.user?.name) localStorage.setItem('userName', data.user.name)

              setStatus('success')
              setMessage('Authentication successful! Redirecting...')
              setTimeout(() => router.push('/dashboard'), 1500)
            } else {
              throw new Error(data.message || 'Failed to authenticate')
            }
          } else {
            throw new Error('No authentication data received')
          }
        }
      } catch (err: any) {
        setStatus('error')
        setMessage(err.message || 'Authentication failed')
        setTimeout(() => router.push('/auth/login'), 3000)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-[#0f172a]">
      <div className="w-full max-w-sm">
        <Card>
          <CardContent className="pt-6">
            {status === 'loading' && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            {status === 'success' && (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            {status === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-[#0f172a]">
        <div className="w-full max-w-sm">
          <Card>
            <CardContent className="pt-6">
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>Loading...</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
