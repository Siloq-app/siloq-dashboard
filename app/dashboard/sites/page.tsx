'use client'

import { useState } from 'react'
import SitesScreen from '@/components/screens/SitesScreen'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function SitesPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="p-6">
          <SitesScreen />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
