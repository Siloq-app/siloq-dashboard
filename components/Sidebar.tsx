'use client'

import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { 
  Target, GitBranch, Clock, FileText, Link2, Settings, Menu, ChevronUp, LogOut, User, HelpCircle, Search, MoreVertical
} from 'lucide-react'
import { TabType } from './Dashboard'

interface SidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  pendingCount: number
  isOpen?: boolean
  onToggle?: () => void
}

const navItems = [
  { id: 'dashboard' as const, icon: Target, label: 'Dashboard' },
  { id: 'silos' as const, icon: GitBranch, label: 'Silos' },
  { id: 'approvals' as const, icon: Clock, label: 'Approvals' },
  { id: 'content' as const, icon: FileText, label: 'Content' },
  { id: 'links' as const, icon: Link2, label: 'Internal Links' },
  { id: 'settings' as const, icon: Settings, label: 'Settings' },
]

export default function Sidebar({ activeTab, onTabChange, pendingCount, isOpen: controlledIsOpen, onToggle }: SidebarProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(true)
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  
  const setIsOpen = (value: boolean) => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(value)
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => onToggle ? onToggle() : setIsOpen(true)}
          className="fixed left-4 top-24 z-50 p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Menu size={24} className="text-slate-400" />
        </button>
      )}

      <aside
        className={`fixed left-0 top-0 h-screen shrink-0 border-r border-slate-800 bg-slate-950 transition-all duration-300 ease-in-out flex flex-col z-40 ${
          isOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        {/* Header with Team Switcher */}
        <div className="flex items-center gap-2 p-2">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="flex flex-1 items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-slate-800 h-12"
                type="button"
              >
                <svg width="32" height="32" viewBox="0 0 249 234" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M210 222H12V12H237V188" stroke="url(#paint0_linear_61_4)" strokeWidth="24"/>
                  <path d="M225 188H249V213L225 188Z" fill="#D39938"/>
                  <path d="M210 210L210 234L234 234L210 210Z" fill="#D39938"/>
                  <rect x="114" y="54" width="20" height="25" fill="url(#paint1_linear_61_4)"/>
                  <rect x="113" y="156" width="20" height="25" fill="url(#paint2_linear_61_4)"/>
                  <rect x="189" y="109" width="20" height="25" transform="rotate(90 189 109)" fill="url(#paint3_linear_61_4)"/>
                  <rect x="85" y="109" width="20" height="25" transform="rotate(90 85 109)" fill="url(#paint4_linear_61_4)"/>
                  <circle cx="124" cy="117" r="20" fill="url(#paint5_linear_61_4)"/>
                  <defs>
                  <linearGradient id="paint0_linear_61_4" x1="-4.25475" y1="-20.3715" x2="291.731" y2="322.193" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FDD96A"/>
                  <stop offset="0.5" stopColor="#D39938"/>
                  </linearGradient>
                  <linearGradient id="paint1_linear_61_4" x1="116.016" y1="53.4094" x2="139.609" y2="75.7712" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FED86A"/>
                  <stop offset="0.5" stopColor="#D39938"/>
                  </linearGradient>
                  <linearGradient id="paint2_linear_61_4" x1="115.016" y1="155.409" x2="138.609" y2="177.771" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FED86A"/>
                  <stop offset="0.5" stopColor="#D39938"/>
                  </linearGradient>
                  <linearGradient id="paint3_linear_61_4" x1="191.016" y1="108.409" x2="214.609" y2="130.771" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FED86A"/>
                  <stop offset="0.5" stopColor="#D39938"/>
                  </linearGradient>
                  <linearGradient id="paint4_linear_61_4" x1="87.0155" y1="108.409" x2="110.609" y2="130.771" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FED86A"/>
                  <stop offset="0.5" stopColor="#D39938"/>
                  </linearGradient>
                  <linearGradient id="paint5_linear_61_4" x1="108.031" y1="96.0551" x2="145.298" y2="140.207" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FED86A"/>
                  <stop offset="0.5" stopColor="#D39938"/>
                  </linearGradient>
                  </defs>
                </svg>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-extrabold text-slate-200">Siloq</span>
                  <span className="truncate text-xs text-slate-500">Enterprise</span>
                </div>
                <ChevronUp className="ml-auto size-4 text-slate-400" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[200px] rounded-lg border border-slate-700 bg-slate-900 p-1 shadow-lg"
                sideOffset={4}
                align="start"
              >
                <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-300 outline-none hover:bg-slate-800 hover:text-slate-100">
                  <Target className="size-4" />
                  <span>Siloq Inc</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-300 outline-none hover:bg-slate-800 hover:text-slate-100">
                  <GitBranch className="size-4" />
                  <span>Acme Corp</span>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-slate-700" />
                <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-300 outline-none hover:bg-slate-800 hover:text-slate-100">
                  <span>+ Add Team</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Platform Group */}
          <div className="relative flex w-full min-w-0 flex-col p-2">
            <div className="flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-slate-500">
              Platform
            </div>
            <ul className="flex w-full min-w-0 flex-col gap-0">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                const showBadge = item.id === 'approvals' && pendingCount > 0

                return (
                  <li key={item.id} className="group/menu-item relative">
                    <button
                      onClick={() => onTabChange(item.id)}
                      className={`flex w-full items-center gap-2 rounded-md p-2 text-left transition-colors h-8 text-sm ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                      }`}
                      type="button"
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {showBadge && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-1 p-2 border-t border-slate-800">
          {/* Help, Search */}
          <button className="flex w-full items-center gap-2 rounded-md p-2 text-left transition-colors hover:bg-slate-800 h-9 text-sm text-slate-400 hover:text-slate-100">
            <HelpCircle className="size-4 shrink-0" />
            <span>Get Help</span>
          </button>
          <button className="flex w-full items-center gap-2 rounded-md p-2 text-left transition-colors hover:bg-slate-800 h-9 text-sm text-slate-400 hover:text-slate-100">
            <Search className="size-4 shrink-0" />
            <span>Search</span>
          </button>

          {/* User Profile */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="flex w-full items-center gap-2 rounded-md p-2 text-left transition-colors hover:bg-slate-800 h-12 mt-1"
                type="button"
              >
                <span className="relative flex size-8 shrink-0 select-none rounded-full bg-slate-800 items-center justify-center text-xs font-medium text-slate-300 overflow-hidden">
                  <svg viewBox="0 0 24 24" className="size-5 text-slate-400" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </span>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-slate-200">shadcn</span>
                  <span className="truncate text-xs text-slate-500">m@example.com</span>
                </div>
                <MoreVertical className="ml-auto size-4 text-slate-400" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[200px] rounded-lg border border-slate-700 bg-slate-900 p-1 shadow-lg"
                sideOffset={4}
                align="start"
              >
                <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-300 outline-none hover:bg-slate-800 hover:text-slate-100">
                  <User className="size-4" />
                  <span>Profile</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-300 outline-none hover:bg-slate-800 hover:text-slate-100">
                  <Settings className="size-4" />
                  <span>Settings</span>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-slate-700" />
                <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-red-400 outline-none hover:bg-slate-800 hover:text-red-300">
                  <LogOut className="size-4" />
                  <span>Log out</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </aside>
    </>
  )
}
