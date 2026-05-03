'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: '🏠' },
  { name: 'Documents', href: '/documents', icon: '📄' },
  { name: 'Clients', href: '/clients', icon: '👥' },
  { name: 'Statistiques', href: '/stats', icon: '📊' },
  { name: 'Paramètres', href: '/settings', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-none">FactureDoc</div>
            <div className="text-xs text-primary font-medium">AI</div>
          </div>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="px-4 py-4 border-b border-gray-100">
        <Link
          href="/documents/new"
          className="flex items-center justify-center gap-2 w-full bg-primary text-white py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
        >
          <span className="text-lg">+</span>
          Nouveau document
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 w-full transition"
        >
          <span>🚪</span>
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
