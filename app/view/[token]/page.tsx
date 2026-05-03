import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import Link from 'next/link'
import { headers } from 'next/headers'

export default async function ViewDocumentPage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = createAdminClient()

  const { data: document } = await supabase
    .from('documents')
    .select('*, client:clients(*), lines:document_lines(*), profile:profiles(*)')
    .eq('view_token', params.token)
    .single()

  if (!document) notFound()

  // Track view
  if (!document.viewed_at) {
    await supabase
      .from('documents')
      .update({ viewed_at: new Date().toISOString(), status: document.status === 'sent' ? 'viewed' : document.status })
      .eq('id', document.id)
  }

  const profile = document.profile as any
  const client = document.client as any
  const lines = document.lines as any[]

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-8 py-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  {document.type === 'invoice' ? 'FACTURE' : 'DEVIS'}
                </h1>
                <p className="text-blue-200 mt-1">N° {document.number}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-blue-200">Date</p>
                <p className="font-semibold">{formatDate(document.issue_date)}</p>
                {document.due_date && (
                  <>
                    <p className="text-blue-200 mt-2">Échéance</p>
                    <p className="font-semibold">{formatDate(document.due_date)}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Parties */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">De</h3>
                <p className="font-semibold text-gray-900">{profile?.company_name || profile?.full_name}</p>
                {profile?.company_address && <p className="text-sm text-gray-600">{profile.company_address}</p>}
                {profile?.company_city && <p className="text-sm text-gray-600">{profile.company_postal_code} {profile.company_city}</p>}
                {profile?.company_siret && <p className="text-sm text-gray-500 mt-1">SIRET: {profile.company_siret}</p>}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">À</h3>
                <p className="font-semibold text-gray-900">{client?.name}</p>
                {client?.company && <p className="text-sm text-gray-600">{client.company}</p>}
                {client?.address && <p className="text-sm text-gray-600">{client.address}</p>}
                {client?.city && <p className="text-sm text-gray-600">{client.postal_code} {client.city}</p>}
              </div>
            </div>

            {/* Lines */}
            <table className="w-full mb-8">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase">Qté</th>
                  <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase">Prix unit.</th>
                  <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase">Total HT</th>
                </tr>
              </thead>
              <tbody>
                {(lines || []).map((line: any) => (
                  <tr key={line.id} className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-900">{line.description}</td>
                    <td className="py-3 text-sm text-gray-600 text-right">{line.quantity} {line.unit}</td>
                    <td className="py-3 text-sm text-gray-600 text-right">{formatCurrency(line.unit_price)}</td>
                    <td className="py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(line.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total HT</span>
                  <span className="font-medium">{formatCurrency(document.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TVA ({document.tax_rate}%)</span>
                  <span className="font-medium">{formatCurrency(document.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2">
                  <span>Total TTC</span>
                  <span className="text-primary">{formatCurrency(document.total)}</span>
                </div>
              </div>
            </div>

            {/* Payment link */}
            {document.stripe_payment_link_url && document.status !== 'paid' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 text-center">
                <p className="text-sm text-green-700 mb-3">Payez en ligne en toute sécurité</p>
                <a
                  href={document.stripe_payment_link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition"
                >
                  Payer {formatCurrency(document.total)} →
                </a>
              </div>
            )}

            {/* Sign link */}
            {document.sign_token && !document.signed_at && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 text-center">
                <p className="text-sm text-indigo-700 mb-3">Signez électroniquement ce document</p>
                <Link
                  href={`/sign/${document.sign_token}`}
                  className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
                >
                  Signer le document →
                </Link>
              </div>
            )}

            {document.signed_at && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-medium">✅ Document signé le {formatDate(document.signed_at)}</p>
              </div>
            )}

            {/* Notes */}
            {document.notes && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes</p>
                <p className="text-sm text-gray-600">{document.notes}</p>
              </div>
            )}
            {document.terms && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Conditions</p>
                <p className="text-sm text-gray-600">{document.terms}</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Document généré via FactureDoc AI
        </p>
      </div>
    </div>
  )
}
