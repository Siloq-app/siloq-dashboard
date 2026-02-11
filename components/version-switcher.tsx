'use client';

import * as React from 'react';
import Image from 'next/image';

import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';

export function VersionSwitcher({
  versions,
  defaultVersion,
}: {
  versions: string[];
  defaultVersion: string;
}) {
  const [selectedVersion] = React.useState(defaultVersion);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="peer/menu-button ring-sidebar-ring flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-[width,height,padding]">
          <div
            className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg"
            style={{ backgroundColor: 'transparent' }}
          >
            <Image
              src="/symbol.png"
              alt="Siloq"
              width={32}
              height={32}
              className="size-8 object-contain"
            />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold">Siloq</span>
            <span className="text-xs">v{selectedVersion}</span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
