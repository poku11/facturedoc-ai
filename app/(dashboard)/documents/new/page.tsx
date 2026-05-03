'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewDocumentPage() {
  const [type, setType] = useState<'invoice' | 'quote'>('invoice')
  const [userInput, setUserInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleAIGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!userInput.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, userInput }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.upgrade_required) {
          setError('Limite atteinte. Passez à un plan supérieur pour continuer.')
        } else {
          setError(data.error || 'Erreur lors de la génération')
        }
        setLoading(false)
        return
      }

      router.push(`/documents/${data.document.id}`)
    } catch {
      setError('Erreur de connexion. Réessayez.')
      setLoading(false)
    }
  }

  async function handleManual() {
    setLoading(true)
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      if (res.ok) router.push(`/documents/${data.document.id}`)
    } catch {
      setError('Erreur lors de la création')
    }
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/documents" className="text-gray-400 hover:text-gray-600 transition">
          ← Documents
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Nouveau document</h1>
      </div>

      {/* Type selector */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {(['invoice', 'quote'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`p-5 rounded-2xl border-2 text-left transition ${
              type === t
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-2">{t === 'invoice' ? '🧾' : '📋'}</div>
            <div className="font-semibold text-gray-900">
              {t === 'invoice' ? 'Facture' : 'Devis'}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {t === 'invoice'
                ? 'Demandez le paiement pour un service rendu'
                : 'Proposez un prix avant de commencer'}
            </div>
          </button>
        ))}
      </div>

      {/* AI Generation */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">✨</span>
          <h2 className="font-semibold text-gray-900">Générer avec l'IA</h2>
        </div>
        <form onSubmit={handleAIGenerate}>
          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            placeholder={`Ex: "Prestation de développement web pour Client SA - 3 jours à 600€/jour, taux TVA 20%, paiement 30 jours"`}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-sm"
          />
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          <button
            type="submit"
            disabled={loading || !userInput.trim()}
            className="mt-3 w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Génération en cours...
              </>
            ) : (
              <>✨ Générer le document</>
            )}
          </button>
        </form>
      </div>

      {/* Manual creation */}
      <button
        onClick={handleManual}
        disabled={loading}
        className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition font-medium text-sm"
      >
        Créer manuellement (document vide)
      </button>
    </div>
  )
}
