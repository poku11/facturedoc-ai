import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendReminderEmail } from '../../../../lib/email/sendReminder'
import { differenceInDays, parseISO } from 'date-fns'

// Use service role for cron (no user context)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export async function GET(request: NextRequest) {
    // Verify cron secret
  const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

  const today = new Date()
    const results = {
          processed: 0,
          sent: 0,
          errors: 0,
    }

  try {
        // Get all sent but unpaid invoices with a due date
      const { data: overdueDocuments, error } = await supabase
          .from('documents')
          .select(`
                  *,
                          client:clients(email, name),
                                  user:profiles(*)
                                        `)
          .eq('type', 'facture')
          .eq('status', 'sent')
          .not('due_date', 'is', null)
          .not('client_id', 'is', null)

      if (error) {
              console.error('Error fetching documents:', error)
              return NextResponse.json({ error: error.message }, { status: 500 })
      }

      for (const doc of overdueDocuments || []) {
              results.processed++

          if (!doc.client?.email || !doc.user) continue

          const dueDate = parseISO(doc.due_date)
              const daysOverdue = differenceInDays(today, dueDate)

          try {
                    // J+3: First reminder (3 days after due)
                if (daysOverdue >= 3 && daysOverdue < 7 && !doc.reminder_3_sent_at) {
                            await sendReminderEmail(
                                          doc,
                                          doc.user,
                                          doc.client.email,
                                          doc.client.name,
                                          'reminder_3'
                                        )

                      await supabase
                              .from('documents')
                              .update({
                                              reminder_3_sent_at: new Date().toISOString(),
                                              status: 'overdue',
                              })
                              .eq('id', doc.id)

                      await supabase.from('email_logs').insert({
                                    document_id: doc.id,
                                    user_id: doc.user_id,
                                    recipient_email: doc.client.email,
                                    subject: `Rappel de paiement - Facture ${doc.number}`,
                                    type: 'reminder_3',
                                    status: 'sent',
                      })

                      results.sent++
                }

                // J+7: Second reminder
                else if (daysOverdue >= 7 && daysOverdue < 14 && !doc.reminder_7_sent_at) {
                            await sendReminderEmail(
                                          doc,
                                          doc.user,
                                          doc.client.email,
                                          doc.client.name,
                                          'reminder_7'
                                        )

                      await supabase
                              .from('documents')
                              .update({ reminder_7_sent_at: new Date().toISOString() })
                              .eq('id', doc.id)

                      await supabase.from('email_logs').insert({
                                    document_id: doc.id,
                                    user_id: doc.user_id,
                                    recipient_email: doc.client.email,
                                    subject: `Relance de paiement - Facture ${doc.number} (7 jours de retard)`,
                                    type: 'reminder_7',
                                    status: 'sent',
                      })

                      results.sent++
                }

                // J+14: Final reminder
                else if (daysOverdue >= 14 && !doc.reminder_14_sent_at) {
                            await sendReminderEmail(
                                          doc,
                                          doc.user,
                                          doc.client.email,
                                          doc.client.name,
                                          'reminder_14'
                                        )

                      await supabase
                              .from('documents')
                              .update({ reminder_14_sent_at: new Date().toISOString() })
                              .eq('id', doc.id)

                      await supabase.from('email_logs').insert({
                                    document_id: doc.id,
                                    user_id: doc.user_id,
                                    recipient_email: doc.client.email,
                                    subject: `URGENT - Facture ${doc.number} en souffrance (14 jours de retard)`,
                                    type: 'reminder_14',
                                    status: 'sent',
                      })

                      // Notify the owner
                      await supabase.from('notifications').insert({
                                    user_id: doc.user_id,
                                    document_id: doc.id,
                                    type: 'overdue_alert',
                                    title: `Facture ${doc.number} toujours impayée`,
                                    message: `La facture ${doc.number} est en souffrance depuis 14 jours. Dernière relance envoyée.`,
                      })

                      results.sent++
                }
          } catch (err) {
                    console.error(`Error sending reminder for document ${doc.id}:`, err)
                    results.errors++
          }
      }

      return NextResponse.json({
              success: true,
              ...results,
              timestamp: today.toISOString(),
      })
  } catch (error) {
        console.error('Cron error:', error)
        return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
