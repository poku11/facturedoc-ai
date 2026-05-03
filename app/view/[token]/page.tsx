import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DocumentPreview } from '@/components/documents/DocumentPreview'
import { StatusBadge } from '@/components/documents/StatusBadge'
import { formatDate } from '@/lib/utils/formatters'
import Link from 'next/link'

export default async function ViewDocumentPage({
    params,
}: {
    params: { token: string }
}) {
    const supabase = createClient()

  const { data: document } = await supabase
      .from('documents')
      .select('*, client:clients(*), lines:document_lines(*)')
      .eq('view_token', params.token)
      .single()

  if (!document) notFound()

  // Get profile via service role (no auth required for public view)
  const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', document.user_id)
      .single()

  // Track view - only once
  if (!document.viewed_at) {
        await supabase
          .from('documents')
          .update({
                    viewed_at: new Date().toISOString(),
                    status: document.status === 'sent' ? 'viewed' : document.status,
          })
          .eq('id', document.id)
  }

  const sortedLines = (document.lines ?? []).sort(
        (a: { position: number }, b: { position: number }) => a.position - b.position
      )

  return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
              <div className="max-w-3xl mx-auto">
                {/* Header bar */}
                      <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-gray-700">Document N° {document.number}</span>span>
                                            <StatusBadge status={document.status} />
                                </div>div>
                                <div className="flex items-center gap-3">
                                  {document.sign_token && document.status !== 'signed' && document.status !== 'paid' && (
                        <Link
                                          href={`/sign/${document.sign_token}`}
                                          className="inline-flex items-center gap-2 bg-[#1A56DB] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                        Signer ce document
                        </Link>Link>
                                            )}
                                </div>div>
                      </div>div>
              
                {/* Document */}
                      <DocumentPreview
                                  document={{ ...document, lines: sortedLines }}
                                  profile={profile}
                                  showPayButton={!!document.stripe_payment_link && document.status !== 'paid'}
                                />
              
                {/* Footer */}
                      <p className="text-center text-xs text-gray-400 mt-6">
                                Document cree avec{' '}
                                <a href="https://facturedoc.ai" className="hover:underline">FactureDoc AI</a>a>
                        {document.viewed_at && (
                      <> &middot; Consulte le {formatDate(document.viewed_at)}</>>
                    )}
                      </p>p>
              </div>div>
        </div>div>
      )
}</></div>
