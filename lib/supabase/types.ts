export type Plan = 'free' | 'starter' | 'pro' | 'business'
export type DocumentType = 'devis' | 'facture' | 'avoir'
export type DocumentStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'paid' | 'cancelled' | 'overdue'
export type ChatRole = 'user' | 'assistant'
export type EmailType = 'document_sent' | 'reminder_3' | 'reminder_7' | 'reminder_14' | 'payment_received' | 'document_signed'

export interface Profile {
    id: string
    email: string
    full_name: string | null
    company_name: string | null
    company_address: string | null
    company_city: string | null
    company_zip: string | null
    company_country: string
    company_phone: string | null
    company_email: string | null
    company_website: string | null
    company_siret: string | null
    company_tva: string | null
    company_logo_url: string | null
    plan: Plan
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
    subscription_status: string
    documents_count: number
    created_at: string
    updated_at: string
}

export interface Client {
    id: string
    user_id: string
    name: string
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    zip: string | null
    country: string
    siret: string | null
    tva_number: string | null
    notes: string | null
    created_at: string
    updated_at: string
}

export interface DocumentLine {
    id: string
    document_id: string
    position: number
    description: string
    quantity: number
    unit: string
    unit_price: number
    tva_rate: number
    total_ht: number
    total_tva: number
    total_ttc: number
    created_at: string
}

export interface Document {
    id: string
    user_id: string
    client_id: string | null
    type: DocumentType
    status: DocumentStatus
    number: string
    title: string | null
    description: string | null
    issue_date: string
    due_date: string | null
    validity_date: string | null
    subtotal: number
    tva_rate: number
    tva_amount: number
    total: number
    currency: string
    payment_terms: string | null
    notes: string | null
    footer_text: string | null
    view_token: string
    sign_token: string
    viewed_at: string | null
    signed_at: string | null
    signature_image: string | null
    signature_ip: string | null
    paid_at: string | null
    stripe_payment_link: string | null
    stripe_payment_intent_id: string | null
    pdf_url: string | null
    sent_at: string | null
    reminder_3_sent_at: string | null
    reminder_7_sent_at: string | null
    reminder_14_sent_at: string | null
    template_id: string
    ai_generated: boolean
    created_at: string
    updated_at: string
    // Relations
  client?: Client | null
    lines?: DocumentLine[]
}

export interface Template {
    id: string
    user_id: string | null
    name: string
    description: string | null
    type: string | null
    is_system: boolean
    content: Record<string, unknown> | null
    thumbnail_url: string | null
    created_at: string
}

export interface Clause {
    id: string
    user_id: string
    title: string
    content: string
    type: string
    created_at: string
}

export interface AIChat {
    id: string
    document_id: string
    user_id: string
    role: ChatRole
    content: string
    created_at: string
}

export interface EmailLog {
    id: string
    document_id: string | null
    user_id: string
    recipient_email: string
    subject: string
    type: EmailType
    status: string
    resend_id: string | null
    sent_at: string
}

export interface Notification {
    id: string
    user_id: string
    document_id: string | null
    type: string
    title: string
    message: string | null
    read: boolean
    created_at: string
}

export interface PlanLimits {
    documents: number
    clients: number
    storage: number
    aiGenerations: number
    features: string[]
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
    free: {
          documents: 3,
          clients: 5,
          storage: 100,
          aiGenerations: 3,
          features: ['basic_templates', 'pdf_export']
    },
    starter: {
          documents: 50,
          clients: 50,
          storage: 1000,
          aiGenerations: 50,
          features: ['basic_templates', 'pdf_export', 'email_send', 'stripe_payment', 'reminders']
    },
    pro: {
          documents: 500,
          clients: 500,
          storage: 5000,
          aiGenerations: 500,
          features: ['all_templates', 'pdf_export', 'email_send', 'stripe_payment', 'reminders', 'signature', 'ai_chat', 'custom_branding']
    },
    business: {
          documents: -1,
          clients: -1,
          storage: -1,
          aiGenerations: -1,
          features: ['all_templates', 'pdf_export', 'email_send', 'stripe_payment', 'reminders', 'signature', 'ai_chat', 'custom_branding', 'api_access', 'priority_support', 'white_label']
    }
}

export interface StripePlan {
    id: Plan
    name: string
    description: string
    price: number
    priceId: string | undefined
    features: string[]
    popular?: boolean
}

export const STRIPE_PLANS: StripePlan[] = [
  {
        id: 'free',
        name: 'Free',
        description: 'Pour commencer',
        price: 0,
        priceId: undefined,
        features: ['3 documents/mois', '5 clients', 'Templates basiques', 'Export PDF']
  },
  {
        id: 'starter',
        name: 'Starter',
        description: 'Pour les indépendants',
        price: 19,
        priceId: process.env.STRIPE_PRICE_STARTER,
        features: ['50 documents/mois', '50 clients', 'Envoi email', 'Paiement Stripe', 'Relances auto']
  },
  {
        id: 'pro',
        name: 'Pro',
        description: 'Pour les PME',
        price: 49,
        priceId: process.env.STRIPE_PRICE_PRO,
        popular: true,
        features: ['500 documents/mois', '500 clients', 'Signature électronique', 'Chat IA', 'Branding personnalisé', 'Tous les templates']
  },
  {
        id: 'business',
        name: 'Business',
        description: 'Pour les grandes équipes',
        price: 99,
        priceId: process.env.STRIPE_PRICE_BUSINESS,
        features: ['Documents illimités', 'Clients illimités', 'API access', 'Support prioritaire', 'White label']
  }
  ]
