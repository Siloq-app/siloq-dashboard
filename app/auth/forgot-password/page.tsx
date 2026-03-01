'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, AlertCircle, Loader2, Send } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [fieldError, setFieldError] = useState<string>('');

  const validateEmail = (value: string): boolean => {
    if (!value) {
      setFieldError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFieldError('Please enter a valid email address');
      return false;
    }
    setFieldError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate before submission
    if (!validateEmail(email)) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Request failed');
      }

      setIsSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-sidebar p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <Link href="/" className="flex items-center gap-2 self-center font-medium text-white">
            <Image
              src="/symbol.png"
              alt="Siloq"
              width={32}
              height={32}
              className="size-8 object-contain"
            />
            Siloq
          </Link>
          <Card>
            <CardContent className="pt-6">
              <Alert variant="success">
                <Send className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-medium">Check your email.</span> We&apos;ve sent a password
                  reset link to {email}. Didn&apos;t receive it? Check your spam folder or{' '}
                  <button onClick={() => setIsSent(false)} className="underline">
                    try again
                  </button>
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-sidebar p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium text-white">
          <Image
            src="/symbol.png"
            alt="Siloq"
            width={32}
            height={32}
            className="size-8 object-contain"
          />
          Siloq
        </Link>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Reset password</CardTitle>
            <CardDescription>Enter your email and we'll send you a reset link</CardDescription>
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  onBlur={() => validateEmail(email)}
                  required
                  disabled={isLoading}
                />
              </div>
              {fieldError && <p className="text-xs text-red-500">{fieldError}</p>}

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="duration-350 inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#005acc] px-4 py-2 text-sm font-medium text-white shadow-sm transition-[color,background-color,border-color,box-shadow,transform] ease-in-out hover:-translate-y-0.5 hover:bg-[#005DCF] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006ff9] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-[#006FF9] dark:hover:bg-[#005DCF] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="text-center text-sm text-muted-foreground">
          <Link href="/auth/login" className="underline underline-offset-4 hover:text-primary">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
