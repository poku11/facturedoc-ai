import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '../../../../../lib/supabase/server'
import { createPaymentLink } from '../../../../../lib/stripe'

export async function POST(request: NextRequest) {
    try {
          const supabase = createServerClient()
          const { data: { user }, error: authError } = await supabase.auth.getUser()
          if (authError || !user) {
                  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
                }

          const body = await request.json()
          const { documentId } = body as { documentId: string }

          if (!documentId) {
                  return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
                }

          const { data: document, error: docError } = await supabase
            .from('documents')
            .select('*, client:clients(email, name)')
            .eq('id', documentId)
            .eq('user_id', user.id)
            .single()

          if (docError || !document) {
                  return NextResponse.json({ error: 'Document not found' }, { status: 404 })
                }

          if (document.type !== 'facture') {
                  return NextResponse.json({ error: 'Payment links are only for invoices' }, { status: 400 })
                }

          const paymentLinkUrl = await createPaymentLink(
                  document.id,
                  document.number,
                  document.title || `Facture ${document.number}`,
                  document.total,
                  document.client?.email
                )

          // Save payment link to document
          const { error: updateError } = await supabase
            .from('documents')
            .update({ stripe_payment_link: paymentLinkUrl })
            .eq('id', documentId)

          if (updateError) {
                  console.error('Error saving payment link:', updateError)
                }

          return NextResponse.json({ url: paymentLinkUrl })
        } catch (error) {
          console.error('Payment link error:', error)
          return NextResponse.json(
                  { error: error instanceof Error ? error.message : 'Internal server error' },
                  { status: 500 }
                )
        }
  }
