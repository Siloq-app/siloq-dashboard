import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Siloq Dashboard',
  description: 'SEO Governance Platform',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans text-slate-200 antialiased">
        {children}
      </body>
    </html>
  )
}
