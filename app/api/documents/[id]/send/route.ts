import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendDocument } from '@/lib/email/sendDocument'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = params

    // Get document with client
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*, client:clients(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (!document.client || !document.client.email) {
      return NextResponse.json({ error: 'Client email required to send document' }, { status: 400 })
    }

    // Get sender profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Send email
    const { id: emailId } = await sendDocument({
      document,
      client: document.client,
      profile,
    })

    // Update document status and log
    await Promise.all([
      supabase.from('documents').update({
        status: document.status === 'draft' ? 'sent' : document.status,
        sent_count: (document.sent_count || 0) + 1,
        last_sent_at: new Date().toISOString(),
      }).eq('id', id),
      supabase.from('email_logs').insert({
        document_id: id,
        user_id: user.id,
        recipient_email: document.client.email,
        subject: `${document.type === 'invoice' ? 'Facture' : 'Devis'} n°${document.number}`,
        type: 'document_sent',
        status: 'sent',
        resend_id: emailId,
      }),
    ])

    return NextResponse.json({ success: true, emailId })
  } catch (error) {
    console.error('Send document error:', error)
    return NextResponse.json({ error: 'Failed to send document' }, { status: 500 })
  }
}
