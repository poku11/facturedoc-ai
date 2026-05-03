import Stripe from 'stripe'
import { Plan } from '../supabase/types'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
    typescript: true,
})

export async function createStripeCustomer(
    email: string,
    name: string
  ): Promise<string> {
    const customer = await stripe.customers.create({
          email,
          name,
          metadata: { source: 'facturedoc-ai' },
    })
    return customer.id
}

export async function createCheckoutSession(
    customerId: string,
    priceId: string,
    plan: Plan,
    userId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    const session = await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ['card'],
          line_items: [
            {
                      price: priceId,
                      quantity: 1,
            },
                ],
          mode: 'subscription',
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
                  userId,
                  plan,
          },
          subscription_data: {
                  metadata: {
                            userId,
                            plan,
                  },
          },
          locale: 'fr',
    })

  if (!session.url) {
        throw new Error('Failed to create checkout session')
  }

  return session.url
}

export async function createPaymentLink(
    documentId: string,
    documentNumber: string,
    description: string,
    amount: number,
    clientEmail?: string
  ): Promise<string> {
    const amountInCents = Math.round(amount * 100)

  const price = await stripe.prices.create({
        currency: 'eur',
        unit_amount: amountInCents,
        product_data: {
                name: `${documentNumber} - ${description}`,
        },
  })

  const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
                    price: price.id,
                    quantity: 1,
          },
              ],
        metadata: {
                documentId,
                documentNumber,
        },
        after_completion: {
                type: 'redirect',
                redirect: {
                          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/payment-success?documentId=${documentId}`,
                },
        },
  })

  return paymentLink.url
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
    await stripe.subscriptions.cancel(subscriptionId)
}

export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.retrieve(subscriptionId)
}

export function constructWebhookEvent(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event {
    return stripe.webhooks.constructEvent(
          payload,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET!
        )
}

export function getPlanFromPriceId(priceId: string): Plan {
    if (priceId === process.env.STRIPE_PRICE_STARTER) return 'starter'
    if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro'
    if (priceId === process.env.STRIPE_PRICE_BUSINESS) return 'business'
    return 'free'
}
