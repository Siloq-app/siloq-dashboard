'use client'

import { useState } from 'react'
import SiloPlanner from '@/components/screens/SiloPlanner'
import { silos } from '@/components/Dashboard'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function SilosPage() {
  const [selectedSilo, setSelectedSilo] = useState<typeof silos[0] | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="p-6">
          <SiloPlanner 
            silos={silos} 
            selectedSilo={selectedSilo} 
            onGenerateClick={() => setShowGenerateModal(true)} 
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
