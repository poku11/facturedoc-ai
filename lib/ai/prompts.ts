import type { Profile, Client, DocumentType } from '../supabase/types'

export function getDocumentGenerationPrompt(
  type: DocumentType,
  userInput: string,
  profile: Profile,
  client?: Client | null
): string {
  return JSON.stringify({
    system: 'Expert comptable français',
    type,
    userInput,
    issuer: { name: profile.company_name || profile.full_name, siret: profile.company_siret },
    client: client ? { name: client.name, email: client.email } : null,
    instructions: 'Génère un document JSON professionnel avec lignes, montants HT/TVA/TTC'
  })
}

export function getDocumentChatSystemPrompt(ctx: { type: DocumentType; number: string; total: number }): string {
  return 'Tu es un expert comptable. Document: ' + ctx.type + ' n°' + ctx.number + ' total: ' + ctx.total + 'EUR. Aide à modifier ce document professionnel.'
}

export const PLAN_LIMITS = {
  free: { documents: 5, ai_credits: 10 },
  starter: { documents: 50, ai_credits: 100 },
  pro: { documents: 500, ai_credits: 1000 },
  business: { documents: Infinity, ai_credits: Infinity },
} as const
