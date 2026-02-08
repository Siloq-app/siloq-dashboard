'use client'

import { useState } from 'react'
import ContentHub from '@/components/screens/ContentHub'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function InternalLinksPage() {
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Internal Links</h1>
          <ContentHub onGenerateClick={() => setShowGenerateModal(true)} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
