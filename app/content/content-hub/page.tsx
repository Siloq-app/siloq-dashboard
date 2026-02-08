'use client'

import { useState } from 'react'
import ContentHub from '@/components/screens/ContentHub'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function ContentHubPage() {
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="p-6">
          <ContentHub onGenerateClick={() => setShowGenerateModal(true)} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
