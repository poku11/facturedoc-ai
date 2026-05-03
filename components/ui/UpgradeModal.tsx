'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Check, X, Crown } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import { STRIPE_PLANS, type Plan } from '@/lib/supabase/types'

interface UpgradeModalProps {
    isOpen: boolean
    onClose: () => void
    currentPlan: Plan
    feature?: string
}

export function UpgradeModal({ isOpen, onClose, currentPlan, feature }: UpgradeModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)

  const plans = STRIPE_PLANS.filter(p => p.id !== 'free')

  const handleUpgrade = async (planId: Plan) => {
        if (planId === currentPlan) return
        setLoading(planId)
        try {
                const res = await fetch('/api/stripe/checkout', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ planId }),
                })
                const data = await res.json()
                if (data.url) router.push(data.url)
        } catch (err) {
                console.error(err)
        } finally {
                setLoading(null)
        }
  }

  return (
        <Modal isOpen={isOpen} onClose={onClose} size="full" title="Passez a un plan superieur">
          {feature && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                            <Zap className="text-amber-500 mt-0.5 flex-shrink-0" size={18} />
                            <p className="text-sm text-amber-800">
                                        La fonctionnalite <strong>{feature}</strong>strong> necessite un abonnement superieur.
                            </p>p>
                  </div>div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => (
                    <div
                                  key={plan.id}
                                  className={`relative rounded-2xl border-2 p-6 flex flex-col gap-4 ${
                                                  plan.popular
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-gray-200 bg-white'
                                  }`}
                                >
                      {plan.popular && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                                <span className="bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                                                                                  <Crown size={10} /> Populaire
                                                                </span>span>
                                                </div>div>
                                )}
                                <div>
                                              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>h3>
                                              <p className="text-sm text-gray-500">{plan.description}</p>p>
                                </div>div>
                                <div className="flex items-baseline gap-1">
                                              <span className="text-3xl font-bold text-gray-900">{plan.price}€</span>span>
                                              <span className="text-sm text-gray-500">/mois</span>span>
                                </div>div>
                                <ul className="space-y-2 flex-1">
                                  {plan.features.map((f) => (
                                                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                                                                    <Check size={14} className="text-emerald-500 flex-shrink-0" />
                                                    {f}
                                                  </li>li>
                                                ))}
                                </ul>ul>
                                <Button
                                                onClick={() => handleUpgrade(plan.id as Plan)}
                                                loading={loading === plan.id}
                                                disabled={currentPlan === plan.id}
                                                variant={plan.popular ? 'primary' : 'outline'}
                                                className="w-full"
                                              >
                                  {currentPlan === plan.id ? 'Plan actuel' : `Choisir ${plan.name}`}
                                </Button>Button>
                    </div>div>
                  ))}
              </div>div>
        </Modal>Modal>
      )
}

export default UpgradeModal</Modal>
