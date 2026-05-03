'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PLANS } from '@/lib/stripe'
import type { Profile } from '@/lib/supabase/types'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single()
          .then(({ data }) => { setProfile(data); setLoading(false) })
      }
    })
  }, [])

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    
    const formData = new FormData(e.currentTarget)
    const updates: Partial<Profile> = {
      full_name: formData.get('full_name') as string,
      company_name: formData.get('company_name') as string,
      company_address: formData.get('company_address') as string,
      company_city: formData.get('company_city') as string,
      company_postal_code: formData.get('company_postal_code') as string,
      company_siret: formData.get('company_siret') as string,
      company_vat_number: formData.get('company_vat_number') as string,
      company_email: formData.get('company_email') as string,
      company_phone: formData.get('company_phone') as string,
    }

    await supabase.from('profiles').update(updates).eq('id', profile.id)
    setProfile(prev => prev ? { ...prev, ...updates } : prev)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  async function handleUpgrade(plan: string) {
    setUpgrading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch { setUpgrading(null) }
  }

  if (loading) return <div className="p-6 text-center text-gray-400">Chargement...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Paramètres</h1>

      {/* Profile form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-6">Informations de l\'entreprise</h2>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
              <input name="full_name" defaultValue={profile?.full_name || ''} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de l\'entreprise</label>
              <input name="company_name" defaultValue={profile?.company_name || ''} className="input" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse</label>
              <input name="company_address" defaultValue={profile?.company_address || ''} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Code postal</label>
              <input name="company_postal_code" defaultValue={profile?.company_postal_code || ''} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville</label>
              <input name="company_city" defaultValue={profile?.company_city || ''} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">SIRET</label>
              <input name="company_siret" defaultValue={profile?.company_siret || ''} className="input" placeholder="xxx xxx xxx xxxxx" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">N° TVA</label>
              <input name="company_vat_number" defaultValue={profile?.company_vat_number || ''} className="input" placeholder="FR xx xxxxxxxxx" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email de facturation</label>
              <input name="company_email" type="email" defaultValue={profile?.company_email || ''} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
              <input name="company_phone" defaultValue={profile?.company_phone || ''} className="input" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving} className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            {saved && <span className="text-green-600 text-sm">✓ Sauvegardé avec succès</span>}
          </div>
        </form>
      </div>

      {/* Plans */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-2">Plan actuel</h2>
        <p className="text-sm text-gray-500 mb-6">
          Vous êtes sur le plan <strong className="text-primary capitalize">{profile?.plan}</strong>.
          {profile?.plan === 'free' && ' Passez à un plan payant pour débloquer plus de fonctionnalités.'}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(PLANS).map(([key, plan]) => (
            <div key={key} className={`rounded-xl border-2 p-4 ${profile?.plan === key ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
              <div className="font-bold text-gray-900">{plan.name}</div>
              <div className="text-2xl font-bold text-primary mt-1">
                {plan.price === 0 ? 'Gratuit' : `${plan.price}€`}
                {plan.price > 0 && <span className="text-sm font-normal text-gray-500">/mois</span>}
              </div>
              <ul className="mt-3 space-y-1.5">
                {plan.features.map(f => (
                  <li key={f} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              {profile?.plan !== key && key !== 'free' && (
                <button
                  onClick={() => handleUpgrade(key)}
                  disabled={!!upgrading}
                  className="mt-4 w-full bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {upgrading === key ? '...' : 'Passer au plan'}
                </button>
              )}
              {profile?.plan === key && (
                <div className="mt-4 text-center text-xs text-primary font-semibold">Plan actuel</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
