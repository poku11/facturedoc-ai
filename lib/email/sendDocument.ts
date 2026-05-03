import { Resend } from 'resend'
import type { Document, Client, Profile } from '../supabase/types'
import { formatCurrency, formatDate } from '../utils/formatters'

const resend = new Resend(process.env.RESEND_API_KEY!)

interface SendDocumentOptions {
  document: Document
  client: Client
  profile: Profile
  pdfBuffer?: Buffer
}

export async function sendDocument({
  document,
  client,
  profile,
  pdfBuffer,
}: SendDocumentOptions): Promise<{ id: string }> {
  if (!client.email) throw new Error('Client has no email address')

  const viewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/view/${document.view_token}`
  const docType = document.type === 'invoice' ? 'Facture' : 'Devis'
  const senderName = profile.company_name || profile.full_name || 'FactureDoc AI'

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1f2937; margin: 0; padding: 0; background: #f9fafb; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background: #1A56DB; color: white; padding: 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .body { padding: 32px; }
    .doc-info { background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .doc-info p { margin: 8px 0; }
    .btn { display: inline-block; background: #1A56DB; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .footer { background: #f9fafb; padding: 24px 32px; font-size: 13px; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${senderName}</h1>
      <p style="margin: 8px 0 0; opacity: 0.9">${docType} n°${document.number}</p>
    </div>
    <div class="body">
      <p>Bonjour ${client.name},</p>
      <p>Veuillez trouver ci-dessous votre ${docType.toLowerCase()} :</p>
      <div class="doc-info">
        <p><strong>Numéro:</strong> ${document.number}</p>
        <p><strong>Date:</strong> ${formatDate(document.issue_date)}</p>
        ${document.due_date ? `<p><strong>Échéance:</strong> ${formatDate(document.due_date)}</p>` : ''}
        <p><strong>Montant total:</strong> ${formatCurrency(document.total, document.currency)}</p>
        ${document.stripe_payment_link_url ? `<p><strong>Payer en ligne:</strong> <a href="${document.stripe_payment_link_url}" style="color: #1A56DB">Lien de paiement sécurisé</a></p>` : ''}
      </div>
      <a href="${viewUrl}" class="btn">Voir le document</a>
      ${document.sign_token ? `<p style="margin-top: 16px"><a href="${process.env.NEXT_PUBLIC_APP_URL}/sign/${document.sign_token}" style="color: #1A56DB">Signer électroniquement</a></p>` : ''}
    </div>
    <div class="footer">
      <p>${senderName} • Envoyé via FactureDoc AI</p>
      <p>Ce document est conforme à la législation française.</p>
    </div>
  </div>
</body>
</html>`

  const result = await resend.emails.send({
    from: `${senderName} <noreply@facturedoc.ai>`,
    to: client.email,
    subject: `${docType} n°${document.number} - ${formatCurrency(document.total, document.currency)}`,
    html,
    attachments: pdfBuffer ? [{ filename: `${document.number}.pdf`, content: pdfBuffer }] : [],
  })

  return { id: result.data?.id || '' }
}
