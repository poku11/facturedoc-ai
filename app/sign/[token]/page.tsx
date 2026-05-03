'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, FileX, Loader2 } from 'lucide-react'
import { SignaturePad } from '@/components/documents/SignaturePad'
import { DocumentPreview } from '@/components/documents/DocumentPreview'
import { StatusBadge } from '@/components/documents/StatusBadge'
import { formatDate } from '@/lib/utils/formatters'

export default function SignDocumentPage() {
    const params = useParams()
    const [document, setDocument] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [signing, setSigning] = useState(false)
    const [signed, setSigned] = useState(false)
    const [error, setError] = useState('')

  useEffect(() => {
        fetch(`/api/documents/sign/${params.token}`)
          .then(r => r.json())
          .then(data => {
                    if (data.document) {
                                setDocument(data.document)
                                setProfile(data.profile ?? null)
                                if (data.document.signed_at) setSigned(true)
                    } else {
                                setError('Document introuvable ou lien invalide')
                    }
          })
          .catch(() => setError('Erreur de connexion'))
          .finally(() => setLoading(false))
  }, [params.token])

  const handleSign = async (signatureDataUrl: string) => {
        setSigning(true)
        try {
                const res = await fetch(`/api/documents/sign/${params.token}`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ signature: signatureDataUrl }),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error ?? 'Erreur de signature')
                setSigned(true)
                setDocument((prev: any) => ({ ...prev, status: 'signed', signed_at: new Date().toISOString(), signature_image: signatureDataUrl }))
        } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur')
        } finally {
                setSigning(false)
        }
  }

  if (loading) {
        return (
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>div>
              )
  }
  
    if (error) {
          return (
                  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                          <div className="text-center">
                                    <FileX className="w-12 h-12 text-red-400 mx-auto mb-3" />
                                    <p className="text-gray-700 font-medium">{error}</p>p>
                          </div>div>
                  </div>div>
                )
    }
  
    if (signed) {
          return (
                  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
                                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Document signe !</h1>h1>
                                    <p className="text-gray-500">
                                                Votre signature a ete enregistree le{' '}
                                                <strong>{document?.signed_at ? formatDate(document.signed_at) : 'maintenant'}</strong>strong>.
                                    </p>p>
                                    <p className="text-sm text-gray-400 mt-4">
                                                Un exemplaire signe vous a ete envoye par email.
                                    </p>p>
                          </div>div>
                  </div>div>
                )
    }
  
    const sortedLines = (document?.lines ?? []).sort(
          (a: { position: number }, b: { position: number }) => a.position - b.position
              )
      
        return (
              <div className="min-h-screen bg-gray-100 py-8 px-4">
                    <div className="max-w-3xl mx-auto space-y-6">
                      {/* Header */}
                            <div className="flex items-center gap-3">
                                      <span className="text-sm font-medium text-gray-700">Signature electronique — {document?.number}</span>span>
                                      <StatusBadge status={document?.status ?? 'sent'} />
                            </div>div>
                    
                      {/* Document preview */}
                            <DocumentPreview
                                        document={{ ...document, lines: sortedLines }}
                                        profile={profile}
                                      />
                    
                      {/* Signature section */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                      <h2 className="text-lg font-semibold text-gray-900 mb-1">Signature electronique</h2>h2>
                                      <p className="text-sm text-gray-500 mb-6">
                                                  En signant ce document, vous acceptez les termes et conditions et confirmez votre accord.
                                      </p>p>
                                      <SignaturePad
                                                    onSave={handleSign}
                                                    loading={signing}
                                                  />
                            </div>div>
                    </div>div>
              </div>div>
            )
}</div>
