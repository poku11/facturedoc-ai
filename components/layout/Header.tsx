'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Bell, Search, ChevronDown, LogOut, Settings, User, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/formatters'
import type { Profile } from '@/lib/supabase/types'

const pageTitles: Record<string, string> = {
    '/dashboard': 'Tableau de bord',
    '/documents': 'Documents',
    '/documents/new': 'Nouveau document',
    '/clients': 'Clients',
    '/stats': 'Statistiques',
    '/settings': 'Parametres',
}

interface HeaderProps {
    profile: Profile | null
}

export function Header({ profile }: HeaderProps) {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [notifOpen, setNotifOpen] = useState(false)

  const pageTitle = Object.entries(pageTitles).find(([path]) =>
        pathname.endsWith(path)
                                                      )?.[1] ?? 'FactureDoc AI'

  const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
  }

  const planColors: Record<string, string> = {
        free: 'bg-gray-100 text-gray-600',
        starter: 'bg-blue-100 text-blue-700',
        pro: 'bg-purple-100 text-purple-700',
        business: 'bg-amber-100 text-amber-700',
  }

  const plan = profile?.plan ?? 'free'

  return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
              <div className="flex items-center gap-4">
                      <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>h1>
              </div>div>
        
              <div className="flex items-center gap-2 md:gap-3">
                {/* Plan badge */}
                      <span className={cn('hidden md:inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full capitalize', planColors[plan])}>
                                <Zap size={10} />
                        {plan}
                      </span>span>
              
                {/* Notifications */}
                      <div className="relative">
                                <button
                                              onClick={() => setNotifOpen(!notifOpen)}
                                              className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                                            >
                                            <Bell size={18} />
                                </button>button>
                        {notifOpen && (
                      <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-50">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Notifications</h3>h3>
                                    <p className="text-sm text-gray-500 text-center py-4">Aucune notification</p>p>
                      </div>div>
                                )}
                      </div>div>
              
                {/* User menu */}
                      <div className="relative">
                                <button
                                              onClick={() => setDropdownOpen(!dropdownOpen)}
                                              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                                              {profile?.full_name?.charAt(0)?.toUpperCase() ?? profile?.email?.charAt(0)?.toUpperCase() ?? 'U'}
                                            </div>div>
                                            <div className="hidden md:block text-left">
                                                          <p className="text-sm font-medium text-gray-900 leading-tight">
                                                            {profile?.full_name ?? 'Utilisateur'}
                                                          </p>p>
                                                          <p className="text-xs text-gray-500 leading-tight truncate max-w-[120px]">
                                                            {profile?.email}
                                                          </p>p>
                                            </div>div>
                                            <ChevronDown size={14} className="text-gray-400 hidden md:block" />
                                </button>button>
                      
                        {dropdownOpen && (
                      <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                                    <div className="px-3 py-2 border-b border-gray-100 mb-1">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name ?? 'Utilisateur'}</p>p>
                                                    <p className="text-xs text-gray-500 truncate">{profile?.email}</p>p>
                                    </div>div>
                                    <button
                                                      onClick={() => { router.push('/settings'); setDropdownOpen(false) }}
                                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                    >
                                                    <Settings size={15} /> Parametres
                                    </button>button>
                                    <button
                                                      onClick={handleSignOut}
                                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                    <LogOut size={15} /> Deconnexion
                                    </button>button>
                      </div>div>
                                )}
                      </div>div>
              </div>div>
        </header>header>
      )
}

export default Header</header>
