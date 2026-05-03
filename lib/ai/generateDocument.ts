import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '../supabase/server'
import type { Profile, Client, DocumentType, DocumentLine } from '../supabase/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface GenerateDocumentInput {
  type: DocumentType
  userInput: string
  profile: Profile
  client?: Client | null
  userId: string
}

interface GeneratedDocument {
  title: string
  number: string
  issue_date: string
  due_date: string
  currency: string
  lines: Omit<DocumentLine, 'id' | 'document_id' | 'created_at'>[]
  notes: string
  terms: string
  payment_instructions: string
}

export async function generateDocument(input: GenerateDocumentInput): Promise<GeneratedDocument> {
  const { type, userInput, profile, client } = input
  const today = new Date().toISOString().split('T')[0]
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const year = new Date().getFullYear()
  const prefix = type === 'invoice' ? 'FACT' : 'DEVIS'
  const randomNum = Math.floor(Math.random() * 9000) + 1000

  const systemPrompt = `Tu es un expert-comptable français. Génère un ${type === 'invoice' ? 'facture' : 'devis'} professionnel en JSON.
Réponds UNIQUEMENT avec du JSON valide, sans markdown, sans explication.`

  const userPrompt = `Génère un ${type === 'invoice' ? 'facture' : 'devis'} pour:
Émetteur: ${profile.company_name || profile.full_name || 'Mon entreprise'}
Client: ${client ? client.name + (client.company ? ' (' + client.company + ')' : '') : 'À définir'}
Demande: ${userInput}

Format JSON requis:
{
  "title": "Titre du document",
  "number": "${prefix}-${year}-${randomNum}",
  "issue_date": "${today}",
  "due_date": "${dueDate}",
  "currency": "EUR",
  "lines": [
    {"description": "...", "quantity": 1, "unit": "unité", "unit_price": 100, "tax_rate": 20, "discount_percent": 0, "sort_order": 0}
  ],
  "notes": "Merci pour votre confiance.",
  "terms": "Paiement à 30 jours.",
  "payment_instructions": "Virement bancaire - IBAN: FR76..."
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Invalid response from AI')

  let jsonText = content.text.trim()
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
  }

  const parsed: GeneratedDocument = JSON.parse(jsonText)

  // Calculate totals for each line
  const lines = parsed.lines.map((line, idx) => {
    const subtotal = line.quantity * line.unit_price
    const discount = subtotal * (line.discount_percent / 100)
    const total = subtotal - discount
    return {
      ...line,
      sort_order: idx,
      total,
    }
  })

  return { ...parsed, lines }
}

export async function chatWithAI(
  documentContext: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  newMessage: string
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: 'Tu es un assistant expert en comptabilité française. Document actuel: ' + documentContext,
    messages: [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: newMessage },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Invalid AI response')
  return content.text
}
