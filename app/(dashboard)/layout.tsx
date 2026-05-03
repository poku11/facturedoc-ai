import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
        redirect('/login')
  }

  const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

  return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                      <Header profile={profile} />
                      <main className="flex-1 overflow-y-auto">
                        {children}
                      </main>main>
              </div>div>
        </div>div>
      )
}</div>
