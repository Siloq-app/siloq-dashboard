'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AlertsDemo() {
  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <h1 className="mb-8 text-2xl font-bold text-white">Alert Variants</h1>

      <div className="max-w-2xl space-y-4">
        {/* Default */}
        <Alert>
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM9 9a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0V9Zm0-3a.75.75 0 0 1 1.5 0v1a.75.75 0 0 1-1.5 0V6Z"
              clipRule="evenodd"
              fillRule="evenodd"
            ></path>
          </svg>
          <AlertTitle>Default Alert</AlertTitle>
          <AlertDescription>This is the default alert style.</AlertDescription>
        </Alert>

        {/* Success */}
        <Alert variant="success">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
              clipRule="evenodd"
              fillRule="evenodd"
            ></path>
          </svg>
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>Your changes have been saved.</AlertDescription>
        </Alert>

        {/* Warning */}
        <Alert variant="warning">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
              fillRule="evenodd"
            ></path>
          </svg>
          <AlertTitle>Attention needed</AlertTitle>
          <AlertDescription>
            Please review your settings before continuing.
          </AlertDescription>
        </Alert>

        {/* Destructive/Error */}
        <Alert variant="destructive">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
              clipRule="evenodd"
              fillRule="evenodd"
            ></path>
          </svg>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Something went wrong. Please try again.
          </AlertDescription>
        </Alert>

        {/* Info */}
        <Alert variant="info">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-12a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0V6.75A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
              fillRule="evenodd"
            ></path>
          </svg>
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>Here's something you should know.</AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
