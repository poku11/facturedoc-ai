'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import SignatureCanvas from 'react-signature-canvas'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'

export default function SignDocumentPage() {
  const params = useParams()
  const router = useRouter()
  const sigRef = useRef<SignatureCanvas>(null)
  const [document, setDocument] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)
  const [error, setError] = useState('')
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    fetch(`/api/documents/sign/${params.token}`)
      .then(r => r.json())
      .then(data => {
        if (data.document) {
          setDocument(data.document)
          if (data.document.signed_at) setSigned(true)
        } else {
          setError('Document introuvable ou lien invalide')
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Erreur de chargement')
        setLoading(false)
      })
  }, [params.token])

  async function handleSign() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError('Veuillez signer dans le cadre ci-dessus')
      return
    }

    setSigning(true)
    setError('')

    try {
      const signatureData = sigRef.current.toDataURL('image/png')

      const res = await fetch(`/api/documents/sign/${params.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureData }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la signature')
        setSigning(false)
        return
      }

      setSigned(true)
    } catch {
      setError('Erreur de connexion')
    }
    setSigning(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Chargement du document...</p>
        </div>
      </div>
    )
  }

  if (error && !document) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm max-w-md">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Document signé !</h2>
          <p className="text-gray-500 mb-4">
            {document?.type === 'invoice' ? 'La facture' : 'Le devis'} n°{document?.number} a été signé avec succès.
          </p>
          <a href={`/view/${document?.view_token}`} className="text-primary hover:underline text-sm">
            Voir le document →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-primary px-8 py-6 text-white">
            <h1 className="text-xl font-bold">Signature électronique</h1>
            <p className="text-blue-200 mt-1">
              {document?.type === 'invoice' ? 'Facture' : 'Devis'} n°{document?.number} - {formatCurrency(document?.total)}
            </p>
          </div>

          <div className="p-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-yellow-800">
                En signant ce document, vous acceptez les conditions mentionnées et confirmez votre accord.
                Cette signature a valeur légale conformément au règlement eIDAS.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Signez dans le cadre ci-dessous
              </label>
              <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white relative">
                <SignatureCanvas
                  ref={sigRef}
                  canvasProps={{
                    width: 580,
                    height: 200,
                    className: 'w-full',
                  }}
                  onBegin={() => setIsEmpty(false)}
                />
                {isEmpty && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-gray-300 text-sm select-none">✍️ Signez ici</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => { sigRef.current?.clear(); setIsEmpty(true) }}
                className="mt-2 text-sm text-gray-400 hover:text-gray-600"
              >
                Effacer la signature
              </button>
            </div>

            {error && <div className="mb-4 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</div>}

            <button
              onClick={handleSign}
              disabled={signing || isEmpty}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {signing ? 'Signature en cours...' : 'Confirmer et signer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
