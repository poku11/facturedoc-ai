import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '@/lib/utils/formatters'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: recentDocs, count: totalDocs },
    { data: paidDocs },
    { data: pendingDocs },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('documents').select('*, client:clients(name)', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('documents').select('total').eq('user_id', user.id).eq('status', 'paid'),
    supabase.from('documents').select('total').eq('user_id', user.id).in('status', ['sent', 'viewed', 'overdue']),
  ])

  const totalRevenue = (paidDocs || []).reduce((sum, d) => sum + d.total, 0)
  const pendingRevenue = (pendingDocs || []).reduce((sum, d) => sum + d.total, 0)

  const stats = [
    { label: 'Documents créés', value: totalDocs || 0, icon: '📄', color: 'blue' },
    { label: 'Revenus encaissés', value: formatCurrency(totalRevenue), icon: '✅', color: 'green' },
    { label: 'En attente de paiement', value: formatCurrency(pendingRevenue), icon: '⏳', color: 'yellow' },
    { label: 'Plan actuel', value: profile?.plan?.toUpperCase() || 'FREE', icon: '⭐', color: 'purple' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour, {profile?.full_name?.split(' ')[0] || 'là'} 👋
          </h1>
          <p className="text-gray-500 mt-1">Voici un aperçu de votre activité</p>
        </div>
        <Link
          href="/documents/new"
          className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center gap-2"
        >
          <span>+</span> Nouveau document
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Documents */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Documents récents</h2>
          <Link href="/documents" className="text-sm text-primary hover:underline">Voir tout</Link>
        </div>

        {recentDocs && recentDocs.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {recentDocs.map((doc: any) => (
              <div key={doc.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-lg">
                    {doc.type === 'invoice' ? '🧾' : '📋'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{doc.number}</p>
                    <p className="text-xs text-gray-500">{doc.client?.name || 'Sans client'} • {formatDate(doc.issue_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-900 text-sm">{formatCurrency(doc.total)}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    doc.status === 'paid' ? 'bg-green-100 text-green-700' :
                    doc.status === 'overdue' ? 'bg-red-100 text-red-700' :
                    doc.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {getStatusLabel(doc.status)}
                  </span>
                  <Link href={`/documents/${doc.id}`} className="text-primary text-sm hover:underline">
                    Ouvrir →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400 text-sm">Aucun document pour l\'instant</p>
            <Link href="/documents/new" className="mt-3 inline-block text-primary font-medium hover:underline text-sm">
              Créer votre premier document →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
