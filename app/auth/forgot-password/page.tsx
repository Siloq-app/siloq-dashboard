'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, ArrowLeft, AlertCircle, Loader2, Check, Send } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [fieldError, setFieldError] = useState<string>('')

  const validateEmail = (value: string): boolean => {
    if (!value) {
      setFieldError('Email is required')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFieldError('Please enter a valid email address')
      return false
    }
    setFieldError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validate before submission
    if (!validateEmail(email)) {
      return
    }
    
    setIsLoading(true)

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Request failed')
      }

      setIsSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-4">
        <Card className="w-full max-w-md bg-slate-900/80 border-slate-700/50">
          <CardContent className="pt-6">
            <Alert variant="success">
              <Send className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">Check your email.</span> We&apos;ve sent a password reset link to {email}.
                Didn&apos;t receive it? Check your spam folder or{' '}
                <button
                  onClick={() => setIsSent(false)}
                  className="underline"
                >
                  try again
                </button>
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Link href="/auth/login">
                <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-4">
      <Card className="w-full max-w-md bg-slate-900/80 border-slate-700/50">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-2">
            <Image
              src="/logo-dark.png"
              alt="Siloq"
              width={150}
              height={150}
              className="rounded-xl"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </div>
          <Link 
            href="/auth/login" 
            className="text-sm text-slate-400 hover:text-slate-300 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
          <CardTitle className="text-2xl font-bold text-slate-100">Reset password</CardTitle>
          <CardDescription className="text-slate-400">
            Enter your email and we'll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  onBlur={() => validateEmail(email)}
                  required
                  disabled={isLoading}
                  className={`bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 pl-10 ${fieldError ? "border-red-500" : ""}`}
                />
              </div>
              {fieldError && (
                <p className="text-xs text-red-500">{fieldError}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Reset Link
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
