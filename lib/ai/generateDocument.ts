import Anthropic from '@anthropic-ai/sdk'
import { DocumentType, DocumentLine } from '../supabase/types'
import { getDocumentGenerationPrompt } from './prompts'

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface GeneratedDocumentData {
    title: string
    description: string
    lines: Array<{
      description: string
      quantity: number
      unit: string
      unit_price: number
      tva_rate: number
    }>
    payment_terms: string
    notes: string
    footer_text: string
    validity_days: number
    due_days: number
}

export interface GenerateDocumentOptions {
    type: DocumentType
    userDescription: string
    clientInfo?: string
    companyInfo?: string
}

export async function generateDocumentWithAI(
    options: GenerateDocumentOptions
  ): Promise<GeneratedDocumentData> {
    const { type, userDescription, clientInfo, companyInfo } = options

  const prompt = getDocumentGenerationPrompt(type, userDescription, clientInfo, companyInfo)

  const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
                    role: 'user',
                    content: prompt,
          },
              ],
  })

  const content = message.content[0]
    if (content.type !== 'text') {
          throw new Error('Unexpected response type from AI')
    }

  let rawText = content.text.trim()

  // Remove markdown code blocks if present
  rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '')
    rawText = rawText.replace(/\s*```$/i, '')
    rawText = rawText.trim()

  let parsed: GeneratedDocumentData
    try {
          parsed = JSON.parse(rawText) as GeneratedDocumentData
    } catch {
          // Try to extract JSON from the response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
          if (!jsonMatch) {
                  throw new Error('Could not parse AI response as JSON')
          }
          parsed = JSON.parse(jsonMatch[0]) as GeneratedDocumentData
    }

  // Validate and sanitize the parsed data
  if (!parsed.lines || !Array.isArray(parsed.lines) || parsed.lines.length === 0) {
        throw new Error('AI response missing document lines')
  }

  // Ensure all required fields have defaults
  return {
        title: parsed.title || `${type.charAt(0).toUpperCase() + type.slice(1)} - ${new Date().toLocaleDateString('fr-FR')}`,
        description: parsed.description || '',
        lines: parsed.lines.map((line, index) => ({
                description: line.description || `Ligne ${index + 1}`,
                quantity: Number(line.quantity) || 1,
                unit: line.unit || 'unité',
                unit_price: Number(line.unit_price) || 0,
                tva_rate: Number(line.tva_rate) || 20,
        })),
        payment_terms: parsed.payment_terms || 'Paiement à 30 jours',
        notes: parsed.notes || '',
        footer_text: parsed.footer_text || '',
        validity_days: Number(parsed.validity_days) || 30,
        due_days: Number(parsed.due_days) || 30,
  }
}

export function calculateDocumentTotals(
    lines: Array<{ quantity: number; unit_price: number; tva_rate: number }>
  ): { subtotal: number; tva_amount: number; total: number } {
    let subtotal = 0
    let tva_amount = 0

  for (const line of lines) {
        const lineHT = line.quantity * line.unit_price
        const lineTVA = lineHT * (line.tva_rate / 100)
        subtotal += lineHT
        tva_amount += lineTVA
  }

  return {
        subtotal: Math.round(subtotal * 100) / 100,
        tva_amount: Math.round(tva_amount * 100) / 100,
        total: Math.round((subtotal + tva_amount) * 100) / 100,
  }
}

export function calculateLineTotals(line: {
    quantity: number
    unit_price: number
    tva_rate: number
}): { total_ht: number; total_tva: number; total_ttc: number } {
    const total_ht = Math.round(line.quantity * line.unit_price * 100) / 100
    const total_tva = Math.round(total_ht * (line.tva_rate / 100) * 100) / 100
    const total_ttc = Math.round((total_ht + total_tva) * 100) / 100

  return { total_ht, total_tva, total_ttc }
}
