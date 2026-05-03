import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '../../../../../lib/supabase/server'
import { createCheckoutSession, createStripeCustomer } from '../../../../../lib/stripe'
import { Plan, STRIPE_PLANS } from '../../../../../lib/supabase/types'

export async function POST(request: NextRequest) {
    try {
          const supabase = createServerClient()
          const { data: { user }, error: authError } = await supabase.auth.getUser()
          if (authError || !user) {
                  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
          }

      const body = await request.json()
          const { plan } = body as { plan: Plan }

      if (!plan || plan === 'free') {
              return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
      }

      const planConfig = STRIPE_PLANS.find(p => p.id === plan)
          if (!planConfig?.priceId) {
                  return NextResponse.json({ error: 'Plan not configured' }, { status: 400 })
          }

      const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

      if (!profile) {
              return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      // Create or use existing Stripe customer
      let customerId = profile.stripe_customer_id
          if (!customerId) {
                  customerId = await createStripeCustomer(
                            user.email!,
                            profile.full_name || profile.company_name || user.email!
                          )
                  await supabase
                    .from('profiles')
                    .update({ stripe_customer_id: customerId })
                    .eq('id', user.id)
          }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL!
          const checkoutUrl = await createCheckoutSession(
                  customerId,
                  planConfig.priceId,
                  plan,
                  user.id,
                  `${baseUrl}/dashboard?checkout=success&plan=${plan}`,
                  `${baseUrl}/settings?checkout=cancelled`
                )

      return NextResponse.json({ url: checkoutUrl })
    } catch (error) {
          console.error('Checkout error:', error)
          return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
                )
    }
}
