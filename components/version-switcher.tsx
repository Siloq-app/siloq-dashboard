"use client"

import * as React from "react"
import Image from "next/image"

import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function VersionSwitcher({
  versions,
  defaultVersion,
}: {
  versions: string[]
  defaultVersion: string
}) {
  const [selectedVersion] = React.useState(defaultVersion)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] h-12">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground overflow-hidden" style={{ backgroundColor: 'transparent' }}>
            <Image src="/symbol.png" alt="Siloq" width={32} height={32} className="size-8 object-contain" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold">Siloq</span>
            <span className="text-xs">v{selectedVersion}</span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
