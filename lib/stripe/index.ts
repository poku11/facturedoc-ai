import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export const PLANS = {
  free: {
    name: 'Gratuit',
    price: 0,
    priceId: null,
    features: ['5 documents/mois', '10 crédits IA', 'Export PDF', 'Support email'],
    limits: { documents: 5, ai_credits: 10 },
  },
  starter: {
    name: 'Starter',
    price: 19,
    priceId: process.env.STRIPE_PRICE_STARTER,
    features: ['50 documents/mois', '100 crédits IA', 'Envoi email', 'Signature électronique', 'Relances auto'],
    limits: { documents: 50, ai_credits: 100 },
  },
  pro: {
    name: 'Pro',
    price: 49,
    priceId: process.env.STRIPE_PRICE_PRO,
    features: ['500 documents/mois', '1000 crédits IA', 'Liens de paiement Stripe', 'Chat IA avancé', 'Templates custom'],
    limits: { documents: 500, ai_credits: 1000 },
  },
  business: {
    name: 'Business',
    price: 99,
    priceId: process.env.STRIPE_PRICE_BUSINESS,
    features: ['Documents illimités', 'IA illimitée', 'API access', 'Support prioritaire', 'Onboarding dédié'],
    limits: { documents: Infinity, ai_credits: Infinity },
  },
} as const

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    locale: 'fr',
    allow_promotion_codes: true,
  })
  return session.url!
}

export async function createOrRetrieveCustomer(
  email: string,
  name: string,
  userId: string
): Promise<string> {
  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data.length > 0) return existing.data[0].id

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { supabase_user_id: userId },
  })
  return customer.id
}

export async function createPaymentLink(
  amount: number,
  description: string,
  documentId: string,
  currency = 'eur'
): Promise<{ id: string; url: string }> {
  const price = await stripe.prices.create({
    unit_amount: Math.round(amount * 100),
    currency,
    product_data: { name: description },
  })

  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: { document_id: documentId },
    after_completion: {
      type: 'redirect',
      redirect: { url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/payment-success?doc=${documentId}` },
    },
  })

  return { id: paymentLink.id, url: paymentLink.url }
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await stripe.subscriptions.cancel(subscriptionId)
}

export async function createPortalSession(customerId: string, returnUrl: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session.url
}
