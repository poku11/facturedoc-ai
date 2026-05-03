import { Resend } from 'resend'
import { Document, Profile } from '../supabase/types'
import { formatCurrency, formatDate, generateViewUrl, generateSignUrl } from '../utils/formatters'

const resend = new Resend(process.env.RESEND_API_KEY!)

export interface SendDocumentOptions {
    document: Document
    profile: Profile
    recipientEmail: string
    recipientName: string
    customMessage?: string
    includeSignature?: boolean
    includePaymentLink?: boolean
}

export async function sendDocumentEmail(options: SendDocumentOptions): Promise<string> {
    const { document, profile, recipientEmail, recipientName, customMessage, includeSignature, includePaymentLink } = options

  const viewUrl = generateViewUrl(document.view_token)
    const signUrl = includeSignature ? generateSignUrl(document.sign_token) : null
    const docTypeLabel = document.type === 'devis' ? 'Devis' : document.type === 'facture' ? 'Facture' : 'Avoir'
    const companyName = profile.company_name || profile.full_name || 'Votre prestataire'

  const subject = `${docTypeLabel} ${document.number} - ${companyName}`

  const html = `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
          <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; background: #fff; }
                      .header { background: #1A56DB; padding: 32px 40px; }
                          .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; }
                              .header p { color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px; }
                                  .body { padding: 40px; }
                                      .greeting { font-size: 16px; margin-bottom: 24px; }
                                          .doc-card { background: #f8faff; border: 1px solid #e0e7ff; border-radius: 8px; padding: 24px; margin: 24px 0; }
                                              .doc-card h3 { margin: 0 0 16px; color: #1A56DB; font-size: 18px; }
                                                  .doc-detail { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
                                                      .doc-detail:last-child { border-bottom: none; }
                                                          .doc-detail .label { color: #6b7280; font-size: 14px; }
                                                              .doc-detail .value { font-weight: 600; font-size: 14px; }
                                                                  .total-row { background: #1A56DB; color: #fff; border-radius: 6px; padding: 12px 16px; margin-top: 16px; display: flex; justify-content: space-between; }
                                                                      .message-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0; }
                                                                          .btn { display: inline-block; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 8px 8px 8px 0; }
                                                                              .btn-primary { background: #1A56DB; color: #fff; }
                                                                                  .btn-secondary { background: #fff; color: #1A56DB; border: 2px solid #1A56DB; }
                                                                                      .btn-success { background: #10B981; color: #fff; }
                                                                                          .footer { background: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center; }
                                                                                              .footer p { color: #9ca3af; font-size: 12px; margin: 4px 0; }
                                                                                                </style>
                                                                                                </head>
                                                                                                <body>
                                                                                                  <div class="container">
                                                                                                      <div class="header">
                                                                                                            <h1>${companyName}</h1>
                                                                                                                  <p>${docTypeLabel} ${document.number}</p>
                                                                                                                      </div>
                                                                                                                          <div class="body">
                                                                                                                                <p class="greeting">Bonjour ${recipientName},</p>
                                                                                                                                      <p>${customMessage || `Veuillez trouver ci-joint votre ${docTypeLabel.toLowerCase()} ${document.number}.`}</p>
                                                                                                                                            
                                                                                                                                                  <div class="doc-card">
                                                                                                                                                          <h3>${document.title || `${docTypeLabel} ${document.number}`}</h3>
                                                                                                                                                                  <div class="doc-detail">
                                                                                                                                                                            <span class="label">Numéro</span>
                                                                                                                                                                                      <span class="value">${document.number}</span>
                                                                                                                                                                                              </div>
                                                                                                                                                                                                      <div class="doc-detail">
                                                                                                                                                                                                                <span class="label">Date d'émission</span>
                                                                                                                                                                                                                          <span class="value">${formatDate(document.issue_date)}</span>
                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                          ${document.due_date ? `<div class="doc-detail"><span class="label">Date d'échéance</span><span class="value">${formatDate(document.due_date)}</span></div>` : ''}
                                                                                                                                                                                                                                                  ${document.validity_date ? `<div class="doc-detail"><span class="label">Valable jusqu'au</span><span class="value">${formatDate(document.validity_date)}</span></div>` : ''}
                                                                                                                                                                                                                                                          <div class="total-row">
                                                                                                                                                                                                                                                                    <span>Total TTC</span>
                                                                                                                                                                                                                                                                              <span style="font-size: 18px;">${formatCurrency(document.total)}</span>
                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                        ${customMessage ? `<div class="message-box"><p style="margin:0;">${customMessage}</p></div>` : ''}
                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                    <div style="margin: 32px 0;">
                                                                                                                                                                                                                                                                                                                            <a href="${viewUrl}" class="btn btn-primary">Voir le ${docTypeLabel.toLowerCase()}</a>
                                                                                                                                                                                                                                                                                                                                    ${signUrl ? `<a href="${signUrl}" class="btn btn-secondary">Signer électroniquement</a>` : ''}
                                                                                                                                                                                                                                                                                                                                            ${document.stripe_payment_link && includePaymentLink ? `<a href="${document.stripe_payment_link}" class="btn btn-success">Payer en ligne</a>` : ''}
                                                                                                                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                              ${document.notes ? `<p style="color: #6b7280; font-size: 14px;">${document.notes}</p>` : ''}
                                                                                                                                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                                                                                                                                      <div class="footer">
                                                                                                                                                                                                                                                                                                                                                                            <p>${companyName}</p>
                                                                                                                                                                                                                                                                                                                                                                                  ${profile.company_email ? `<p>${profile.company_email}</p>` : ''}
                                                                                                                                                                                                                                                                                                                                                                                        ${profile.company_phone ? `<p>${profile.company_phone}</p>` : ''}
                                                                                                                                                                                                                                                                                                                                                                                              <p style="margin-top: 16px; font-size: 11px;">Ce document a été généré par FactureDoc AI</p>
                                                                                                                                                                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                                                                                                    </body>
                                                                                                                                                                                                                                                                                                                                                                                                    </html>`

  const { data, error } = await resend.emails.send({
        from: `${companyName} <noreply@facturedoc.ai>`,
        to: recipientEmail,
        subject,
        html,
  })

  if (error) {
        throw new Error(`Failed to send email: ${error.message}`)
  }

  return data?.id || ''
}
