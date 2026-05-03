import { DocumentType } from '../supabase/types'

export const SYSTEM_PROMPT = `Tu es un expert-comptable et assistant commercial français spécialisé dans la création de devis et factures professionnels.

Tu dois TOUJOURS répondre en JSON valide avec la structure exacte demandée.
Tu connais parfaitement:
- La législation française sur la facturation (mentions obligatoires, TVA, etc.)
- Les bonnes pratiques commerciales françaises
- La rédaction professionnelle en français
- Les tarifs du marché pour différents secteurs d'activité

Règles importantes:
1. Toujours utiliser des montants réalistes pour le marché français
2. Respecter les mentions légales obligatoires
3. Utiliser un langage professionnel et adapté au secteur
4. Les prix sont en euros HT, la TVA standard est à 20%
5. Les délais de paiement standards en France sont 30 jours
6. Toujours générer au minimum 3 lignes de détail pour les documents`

export function getDocumentGenerationPrompt(
    type: DocumentType,
    userDescription: string,
    clientInfo?: string,
    companyInfo?: string
  ): string {
    const typeLabel = type === 'devis' ? 'devis' : type === 'facture' ? 'facture' : 'avoir'

  return `${SYSTEM_PROMPT}

  Génère un ${typeLabel} professionnel en JSON basé sur cette description:
  "${userDescription}"

  ${clientInfo ? `Informations client: ${clientInfo}` : ''}
  ${companyInfo ? `Informations entreprise: ${companyInfo}` : ''}

  Retourne UNIQUEMENT ce JSON (sans markdown, sans backticks):
  {
    "title": "Titre court du document",
      "description": "Description générale du document",
        "lines": [
            {
                  "description": "Description détaillée de la prestation/produit",
                        "quantity": 1,
                              "unit": "unité|heure|jour|forfait|lot",
                                    "unit_price": 0.00,
                                          "tva_rate": 20
                                              }
                                                ],
                                                  "payment_terms": "Paiement à 30 jours",
                                                    "notes": "Notes ou conditions particulières",
                                                      "footer_text": "Mentions légales de pied de page",
                                                        "validity_days": 30,
                                                          "due_days": 30
                                                          }`
}

export function getDocumentChatPrompt(
    documentContext: string,
    userMessage: string
  ): string {
    return `${SYSTEM_PROMPT}

    Tu es en train d'aider à modifier/améliorer ce document:
    ${documentContext}

    L'utilisateur demande: "${userMessage}"

    Si l'utilisateur demande de modifier des lignes, retourne:
    {
      "action": "update_lines",
        "lines": [...nouvelles lignes...]
        }

        Si l'utilisateur demande d'autres modifications (titre, notes, etc.), retourne:
        {
          "action": "update_fields",
            "fields": {
                "title": "...",
                    "notes": "...",
                        "payment_terms": "..."
                          }
                          }

                          Si l'utilisateur pose juste une question, retourne:
                          {
                            "action": "message",
                              "content": "Ta réponse ici"
                              }

                              Retourne UNIQUEMENT le JSON valide, sans markdown.`
}

export function getReminderEmailPrompt(
    documentType: string,
    documentNumber: string,
    clientName: string,
    amount: number,
    daysOverdue: number
  ): string {
    return `Génère un email de relance professionnel et courtois en français.

    Document: ${documentType} ${documentNumber}
    Client: ${clientName}  
    Montant: ${amount}€ TTC
    Jours de retard: ${daysOverdue} jours

    Retourne le JSON:
    {
      "subject": "Objet de l'email",
        "html": "Corps HTML de l'email complet avec mise en forme"
        }

        L'email doit être professionnel, poli, et inclure les détails du document.
        Retourne UNIQUEMENT le JSON valide.`
}
