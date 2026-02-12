'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from 'lucide-react'

const API_BASE_URL = 'https://api.siloq.ai'

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = isRegistering ? '/api/v1/auth/register/' : '/api/v1/auth/login/'
      const body = isRegistering 
        ? { email: formData.email, password: formData.password, name: formData.name }
        : { email: formData.email, password: formData.password }

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok) {
        // Handle validation errors
        if (data.email) {
          throw new Error(data.email[0] || data.email)
        }
        if (data.password) {
          throw new Error(data.password[0] || data.password)
        }
        if (data.non_field_errors) {
          throw new Error(data.non_field_errors[0] || data.non_field_errors)
        }
        throw new Error(data.detail || data.message || 'Authentication failed')
      }

      // Store the token
      if (data.token) {
        localStorage.setItem('token', data.token)
        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        throw new Error('No token received')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {isRegistering ? 'Create an account' : 'Welcome back'}
          </CardTitle>
          <CardDescription>
            {isRegistering 
              ? 'Enter your details to get started'
              : 'Enter your credentials to continue'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="grid gap-4">
                {isRegistering && (
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isRegistering ? 'Create account' : 'Sign in'}
                </Button>
              </div>
              
              <div className="text-center text-sm">
                {isRegistering ? (
                  <>
                    Already have an account?{" "}
                    <button 
                      type="button"
                      onClick={() => { setIsRegistering(false); setError(null) }}
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    Don&apos;t have an account?{" "}
                    <button 
                      type="button"
                      onClick={() => { setIsRegistering(true); setError(null) }}
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      Sign up
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </div>
    </div>
  )
}
