import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent, getPlanFromPriceId } from '../../../../lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Use service role for webhook (no user context)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export async function POST(request: NextRequest) {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
    try {
          event = constructWebhookEvent(body, signature)
    } catch (err) {
          console.error('Webhook signature verification failed:', err)
          return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

  try {
        switch (event.type) {
          case 'checkout.session.completed': {
                    const session = event.data.object as Stripe.Checkout.Session
                    const userId = session.metadata?.userId
                    const plan = session.metadata?.plan
                    const subscriptionId = session.subscription as string

                    if (userId && plan) {
                                await supabase
                                  .from('profiles')
                                  .update({
                                                  plan,
                                                  stripe_subscription_id: subscriptionId,
                                                  subscription_status: 'active',
                                                  updated_at: new Date().toISOString(),
                                  })
                                  .eq('id', userId)

                      // Create notification
                      await supabase.from('notifications').insert({
                                    user_id: userId,
                                    type: 'subscription_activated',
                                    title: `Plan ${plan} activé`,
                                    message: `Votre abonnement ${plan} a été activé avec succès.`,
                      })
                    }
                    break
          }

          case 'customer.subscription.updated': {
                    const subscription = event.data.object as Stripe.Subscription
                    const priceId = subscription.items.data[0]?.price?.id
                    const plan = getPlanFromPriceId(priceId)
                    const customerId = subscription.customer as string

                    const { data: profile } = await supabase
                      .from('profiles')
                      .select('id')
                      .eq('stripe_customer_id', customerId)
                      .single()

                    if (profile) {
                                await supabase
                                  .from('profiles')
                                  .update({
                                                  plan: subscription.status === 'active' ? plan : 'free',
                                                  subscription_status: subscription.status,
                                                  updated_at: new Date().toISOString(),
                                  })
                                  .eq('id', profile.id)
                    }
                    break
          }

          case 'customer.subscription.deleted': {
                    const subscription = event.data.object as Stripe.Subscription
                    const customerId = subscription.customer as string

                    const { data: profile } = await supabase
                      .from('profiles')
                      .select('id')
                      .eq('stripe_customer_id', customerId)
                      .single()

                    if (profile) {
                                await supabase
                                  .from('profiles')
                                  .update({
                                                  plan: 'free',
                                                  stripe_subscription_id: null,
                                                  subscription_status: 'cancelled',
                                                  updated_at: new Date().toISOString(),
                                  })
                                  .eq('id', profile.id)

                      await supabase.from('notifications').insert({
                                    user_id: profile.id,
                                    type: 'subscription_cancelled',
                                    title: 'Abonnement annulé',
                                    message: 'Votre abonnement a été annulé. Vous êtes maintenant sur le plan gratuit.',
                      })
                    }
                    break
          }

          case 'payment_link.payment_method_used': {
                    // Payment via payment link completed
                    const paymentIntent = event.data.object as Stripe.PaymentIntent
                    const documentId = paymentIntent.metadata?.documentId

                    if (documentId) {
                                await supabase
                                  .from('documents')
                                  .update({
                                                  status: 'paid',
                                                  paid_at: new Date().toISOString(),
                                                  stripe_payment_intent_id: paymentIntent.id,
                                                  updated_at: new Date().toISOString(),
                                  })
                                  .eq('id', documentId)
                    }
                    break
          }

          case 'payment_intent.succeeded': {
                    const paymentIntent = event.data.object as Stripe.PaymentIntent
                    const documentId = paymentIntent.metadata?.documentId

                    if (documentId) {
                                const { data: doc } = await supabase
                                  .from('documents')
                                  .select('user_id, number')
                                  .eq('id', documentId)
                                  .single()

                      await supabase
                                  .from('documents')
                                  .update({
                                                  status: 'paid',
                                                  paid_at: new Date().toISOString(),
                                                  stripe_payment_intent_id: paymentIntent.id,
                                  })
                                  .eq('id', documentId)

                      if (doc) {
                                    await supabase.from('notifications').insert({
                                                    user_id: doc.user_id,
                                                    document_id: documentId,
                                                    type: 'payment_received',
                                                    title: 'Paiement reçu',
                                                    message: `Le paiement de la facture ${doc.number} a été reçu.`,
                                    })
                      }
                    }
                    break
          }

          default:
                    console.log(`Unhandled event type: ${event.type}`)
        }

      return NextResponse.json({ received: true })
  } catch (error) {
        console.error('Webhook handler error:', error)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

export const config = {
    api: {
          bodyParser: false,
    },
}
