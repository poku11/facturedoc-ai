import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export const config = { api: { bodyParser: false } }

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription' && session.customer && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0].price.id

        let plan = 'free'
        if (priceId === process.env.STRIPE_PRICE_STARTER) plan = 'starter'
        else if (priceId === process.env.STRIPE_PRICE_PRO) plan = 'pro'
        else if (priceId === process.env.STRIPE_PRICE_BUSINESS) plan = 'business'

        await supabase
          .from('profiles')
          .update({
            plan,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            stripe_subscription_status: subscription.status,
          })
          .eq('stripe_customer_id', session.customer as string)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const priceId = subscription.items.data[0].price.id

      let plan = 'free'
      if (priceId === process.env.STRIPE_PRICE_STARTER) plan = 'starter'
      else if (priceId === process.env.STRIPE_PRICE_PRO) plan = 'pro'
      else if (priceId === process.env.STRIPE_PRICE_BUSINESS) plan = 'business'

      await supabase
        .from('profiles')
        .update({
          plan,
          stripe_subscription_status: subscription.status,
        })
        .eq('stripe_subscription_id', subscription.id)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await supabase
        .from('profiles')
        .update({
          plan: 'free',
          stripe_subscription_id: null,
          stripe_subscription_status: 'canceled',
        })
        .eq('stripe_subscription_id', subscription.id)
      break
    }

    case 'payment_link.payment_completed':
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const documentId = paymentIntent.metadata?.document_id
      if (documentId) {
        await supabase
          .from('documents')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', documentId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
