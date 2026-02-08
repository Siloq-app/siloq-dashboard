'use client'

import ApprovalQueue from '@/components/screens/ApprovalQueue'
import { pendingChanges } from '@/components/Dashboard'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function ApprovalsPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="p-6">
          <ApprovalQueue pendingChanges={pendingChanges} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
