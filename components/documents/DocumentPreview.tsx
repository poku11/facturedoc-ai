'use client'

import { useMemo } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import type { Document, Profile } from '@/lib/supabase/types'
import type { LineItem } from './LineItemsTable'

interface DocumentPreviewProps {
    document: Document & { lines?: LineItem[] }
    profile: Profile | null
    showPayButton?: boolean
}

const DOC_LABELS: Record<string, string> = {
    devis: 'DEVIS',
    facture: 'FACTURE',
    avoir: 'AVOIR',
}

export function DocumentPreview({ document: doc, profile, showPayButton = false }: DocumentPreviewProps) {
    const lines = doc.lines ?? []
        const totalHT = lines.reduce((sum, l) => sum + l.total_ht, 0)
    const totalTVA = lines.reduce((sum, l) => sum + l.total_tva, 0)
    const totalTTC = totalHT + totalTVA

  const tvaGroups = useMemo(() => {
        const groups: Record<number, { ht: number; tva: number }> = {}
              lines.forEach(l => {
                      if (!groups[l.tva_rate]) groups[l.tva_rate] = { ht: 0, tva: 0 }
                      groups[l.tva_rate].ht += l.total_ht
                      groups[l.tva_rate].tva += l.total_tva
              })
        return groups
  }, [lines])

  return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          {/* Header */}
                <div className="bg-[#1A56DB] px-8 py-8">
                        <div className="flex justify-between items-start">
                                  <div>
                                    {profile?.company_logo_url ? (
                        <img src={profile.company_logo_url} alt="Logo" className="h-12 object-contain mb-2" />
                      ) : (
                        <h2 className="text-2xl font-bold text-white">{profile?.company_name ?? 'Votre Entreprise'}</h2>h2>
                                              )}
                                  </div>div>
                                  <div className="text-right">
                                              <p className="text-3xl font-bold text-white">{DOC_LABELS[doc.type] ?? 'DOCUMENT'}</p>p>
                                              <p className="text-blue-200 text-sm mt-1">N° {doc.number}</p>p>
                                  </div>div>
                        </div>div>
                </div>div>
        
              <div className="px-8 py-6 space-y-6">
                {/* Addresses */}
                      <div className="grid grid-cols-2 gap-8">
                        {/* Emetteur */}
                                <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Emetteur</p>p>
                                            <div className="text-sm text-gray-700 space-y-0.5">
                                                          <p className="font-semibold text-gray-900">{profile?.company_name}</p>p>
                                              {profile?.company_address && <p>{profile.company_address}</p>p>}
                                              {(profile?.company_zip || profile?.company_city) && (
                          <p>{[profile.company_zip, profile.company_city].filter(Boolean).join(' ')}</p>p>
                                                          )}
                                              {profile?.company_siret && <p className="text-gray-500">SIRET: {profile.company_siret}</p>p>}
                                              {profile?.company_tva && <p className="text-gray-500">TVA: {profile.company_tva}</p>p>}
                                              {profile?.company_email && <p>{profile.company_email}</p>p>}
                                            </div>div>
                                </div>div>
                        {/* Client */}
                                <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Client</p>p>
                                  {doc.client ? (
                        <div className="text-sm text-gray-700 space-y-0.5">
                                        <p className="font-semibold text-gray-900">{doc.client.name}</p>p>
                          {doc.client.address && <p>{doc.client.address}</p>p>}
                          {(doc.client.zip || doc.client.city) && (
                                            <p>{[doc.client.zip, doc.client.city].filter(Boolean).join(' ')}</p>p>
                                        )}
                          {doc.client.siret && <p className="text-gray-500">SIRET: {doc.client.siret}</p>p>}
                          {doc.client.email && <p>{doc.client.email}</p>p>}
                        </div>div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Aucun client associe</p>p>
                                            )}
                                </div>div>
                      </div>div>
              
                {/* Dates */}
                      <div className="flex gap-8 py-3 border-y border-gray-100">
                                <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wide">Date d'emission</p>p>
                                            <p className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(doc.issue_date)}</p>p>
                                </div>div>
                        {doc.due_date && (
                      <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                                      {doc.type === 'devis' ? 'Valable jusqu'au' : "Echeance"}
                                    </p>p>
                                    <p className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(doc.due_date)}</p>p>
                      </div>div>
                                )}
                        {doc.payment_terms && (
                      <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Conditions</p>p>
                                    <p className="text-sm font-medium text-gray-900 mt-0.5">{doc.payment_terms}</p>p>
                      </div>div>
                                )}
                      </div>div>
              
                {/* Title / Description */}
                {doc.title && (
                    <div>
                                <h3 className="text-base font-semibold text-gray-900">{doc.title}</h3>h3>
                      {doc.description && <p className="text-sm text-gray-600 mt-1">{doc.description}</p>p>}
                    </div>div>
                      )}
              
                {/* Lines */}
                {lines.length > 0 && (
                    <table className="w-full text-sm">
                                <thead>
                                              <tr className="border-b-2 border-gray-200">
                                                              <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Description</th>th>
                                                              <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-16">Qte</th>th>
                                                              <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-24">PU HT</th>th>
                                                              <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-16">TVA</th>th>
                                                              <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-24">Total HT</th>th>
                                              </tr>tr>
                                </thead>thead>
                                <tbody className="divide-y divide-gray-100">
                                  {lines.map((line, i) => (
                                      <tr key={line.id ?? i}>
                                                        <td className="py-2.5 text-gray-800">
                                                          {line.description}
                                                          {line.unit && <span className="text-gray-400 ml-1">({line.unit})</span>span>}
                                                        </td>td>
                                                        <td className="py-2.5 text-right text-gray-700">{line.quantity}</td>td>
                                                        <td className="py-2.5 text-right text-gray-700">{formatCurrency(line.unit_price, doc.currency)}</td>td>
                                                        <td className="py-2.5 text-right text-gray-500">{line.tva_rate}%</td>td>
                                                        <td className="py-2.5 text-right font-medium text-gray-900">{formatCurrency(line.total_ht, doc.currency)}</td>td>
                                      </tr>tr>
                                    ))}
                                </tbody>tbody>
                    </table>table>
                      )}
              
                {/* Totals */}
                      <div className="flex justify-end">
                                <div className="w-64 space-y-1.5">
                                            <div className="flex justify-between text-sm text-gray-600">
                                                          <span>Total HT</span>span>
                                                          <span>{formatCurrency(totalHT, doc.currency)}</span>span>
                                            </div>div>
                                  {Object.entries(tvaGroups).map(([rate, { tva }]) => (
                        <div key={rate} className="flex justify-between text-sm text-gray-500">
                                        <span>TVA {rate}%</span>span>
                                        <span>{formatCurrency(tva, doc.currency)}</span>span>
                        </div>div>
                      ))}
                                            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t-2 border-gray-200">
                                                          <span>Total TTC</span>span>
                                                          <span className="text-[#1A56DB]">{formatCurrency(totalTTC, doc.currency)}</span>span>
                                            </div>div>
                                </div>div>
                      </div>div>
              
                {/* Payment button */}
                {showPayButton && doc.stripe_payment_link && (
                    <div className="text-center pt-2">
                                <a
                                                href={doc.stripe_payment_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 bg-[#1A56DB] text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
                                              >
                                              Payer en ligne — {formatCurrency(totalTTC, doc.currency)}
                                </a>a>
                    </div>div>
                      )}
              
                {/* Notes */}
                {doc.notes && (
                    <div className="p-3 bg-gray-50 rounded-xl">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{doc.notes}</p>p>
                    </div>div>
                      )}
              
                {/* Footer */}
                {doc.footer_text && (
                    <div className="pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-400 text-center">{doc.footer_text}</p>p>
                    </div>div>
                      )}
              
                {/* Signature */}
                {doc.signature_image && (
                    <div className="pt-4">
                                <p className="text-xs text-gray-400 mb-1">Signe electroniquement le {doc.signed_at ? formatDate(doc.signed_at) : ''}</p>p>
                                <img src={doc.signature_image} alt="Signature" className="max-h-20 border border-gray-200 rounded-lg" />
                    </div>div>
                      )}
              </div>div>
        </div>div>
      )
}

export default DocumentPreview</div>
