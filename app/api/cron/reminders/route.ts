import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const results = { sent: 0, errors: 0, skipped: 0 }

  try {
    // Get all overdue documents that need reminders
    const { data: documents } = await supabase
      .from('documents')
      .select(`
        *,
        client:clients(name, email),
        profile:profiles(full_name, company_name, company_email)
      `)
      .in('status', ['sent', 'viewed'])
      .not('due_date', 'is', null)
      .lt('due_date', now.toISOString().split('T')[0])

    if (!documents || documents.length === 0) {
      return NextResponse.json({ message: 'No documents to process', ...results })
    }

    for (const doc of documents) {
      const client = doc.client as any
      const profile = doc.profile as any

      if (!client?.email) { results.skipped++; continue }

      const daysPastDue = Math.floor(
        (now.getTime() - new Date(doc.due_date!).getTime()) / (1000 * 60 * 60 * 24)
      )

      // Update status to overdue if not already
      if (doc.status !== 'overdue') {
        await supabase.from('documents').update({ status: 'overdue' }).eq('id', doc.id)
      }

      // Determine reminder type
      let reminderType: 'reminder_d3' | 'reminder_d7' | 'reminder_d14' | null = null
      let reminderSuffix = ''

      if (daysPastDue === 3) { reminderType = 'reminder_d3'; reminderSuffix = 'J+3' }
      else if (daysPastDue === 7) { reminderType = 'reminder_d7'; reminderSuffix = 'J+7' }
      else if (daysPastDue === 14) { reminderType = 'reminder_d14'; reminderSuffix = 'J+14' }
      else { results.skipped++; continue }

      // Check if already sent this reminder
      const { data: existingLog } = await supabase
        .from('email_logs')
        .select('id')
        .eq('document_id', doc.id)
        .eq('type', reminderType)
        .single()

      if (existingLog) { results.skipped++; continue }

      // Send reminder email
      try {
        const senderName = profile?.company_name || profile?.full_name || 'FactureDoc AI'
        const viewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/view/${doc.view_token}`
        const docType = doc.type === 'invoice' ? 'facture' : 'devis'

        await resend.emails.send({
          from: `${senderName} <noreply@facturedoc.ai>`,
          to: client.email,
          subject: `[Relance ${reminderSuffix}] ${doc.type === 'invoice' ? 'Facture' : 'Devis'} n°${doc.number} en attente de paiement`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <h2 style="color: #1A56DB;">Rappel de paiement</h2>
              <p>Bonjour ${client.name},</p>
              <p>Nous vous rappelons que votre ${docType} n°<strong>${doc.number}</strong> d'un montant de <strong>${formatCurrency(doc.total)}</strong> était due le ${formatDate(doc.due_date!)}.</p>
              ${doc.stripe_payment_link_url ? `<p><a href="${doc.stripe_payment_link_url}" style="background: #1A56DB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 16px 0;">Payer en ligne →</a></p>` : ''}
              <p><a href="${viewUrl}" style="color: #1A56DB;">Voir le document</a></p>
              <p style="color: #6b7280; font-size: 14px;">Cordialement, ${senderName}</p>
            </div>
          `,
        })

        await Promise.all([
          supabase.from('email_logs').insert({
            document_id: doc.id,
            user_id: doc.user_id,
            recipient_email: client.email,
            subject: `Relance ${reminderSuffix} - ${doc.number}`,
            type: reminderType,
            status: 'sent',
          }),
          supabase.from('documents').update({
            reminder_count: (doc.reminder_count || 0) + 1,
            last_reminder_at: now.toISOString(),
          }).eq('id', doc.id),
        ])

        results.sent++
      } catch (err) {
        console.error('Reminder error for doc', doc.id, err)
        results.errors++
      }
    }

    return NextResponse.json({ success: true, ...results })
  } catch (error) {
    console.error('Cron reminders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
