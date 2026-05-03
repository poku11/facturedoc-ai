export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company_name: string | null
          company_address: string | null
          company_city: string | null
          company_postal_code: string | null
          company_country: string
          company_phone: string | null
          company_email: string | null
          company_siret: string | null
          company_vat_number: string | null
          company_logo_url: string | null
          plan: 'free' | 'starter' | 'pro' | 'business'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_subscription_status: string | null
          documents_count: number
          ai_credits_used: number
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']>
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          company: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          country: string
          siret: string | null
          vat_number: string | null
          notes: string | null
          total_invoiced: number
          documents_count: number
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['clients']['Row']>
        Update: Partial<Database['public']['Tables']['clients']['Row']>
      }
      documents: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          template_id: string | null
          type: 'invoice' | 'quote'
          status: 'draft' | 'sent' | 'viewed' | 'signed' | 'paid' | 'overdue' | 'cancelled'
          number: string
          title: string | null
          issue_date: string
          due_date: string | null
          currency: string
          subtotal: number
          tax_rate: number
          tax_amount: number
          discount_amount: number
          total: number
          notes: string | null
          terms: string | null
          payment_instructions: string | null
          view_token: string | null
          sign_token: string | null
          viewed_at: string | null
          signed_at: string | null
          signature_data: string | null
          signature_ip: string | null
          paid_at: string | null
          stripe_payment_link_id: string | null
          stripe_payment_link_url: string | null
          pdf_url: string | null
          ai_generated: boolean
          sent_count: number
          last_sent_at: string | null
          reminder_count: number
          last_reminder_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['documents']['Row']>
        Update: Partial<Database['public']['Tables']['documents']['Row']>
      }
      document_lines: {
        Row: {
          id: string
          document_id: string
          sort_order: number
          description: string
          quantity: number
          unit: string | null
          unit_price: number
          tax_rate: number
          discount_percent: number
          total: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['document_lines']['Row']>
        Update: Partial<Database['public']['Tables']['document_lines']['Row']>
      }
      ai_chats: {
        Row: {
          id: string
          document_id: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['ai_chats']['Row']>
        Update: never
      }
      email_logs: {
        Row: {
          id: string
          document_id: string
          user_id: string
          recipient_email: string
          subject: string
          type: 'document_sent' | 'reminder_d3' | 'reminder_d7' | 'reminder_d14' | 'payment_confirmed'
          status: 'pending' | 'sent' | 'failed' | 'bounced'
          resend_id: string | null
          error_message: string | null
          sent_at: string
        }
        Insert: Partial<Database['public']['Tables']['email_logs']['Row']>
        Update: Partial<Database['public']['Tables']['email_logs']['Row']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          document_id: string | null
          read: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['notifications']['Row']>
        Update: Partial<Database['public']['Tables']['notifications']['Row']>
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type DocumentLine = Database['public']['Tables']['document_lines']['Row']
export type AiChat = Database['public']['Tables']['ai_chats']['Row']
export type EmailLog = Database['public']['Tables']['email_logs']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type DocumentType = 'invoice' | 'quote'
export type DocumentStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'paid' | 'overdue' | 'cancelled'
export type Plan = 'free' | 'starter' | 'pro' | 'business'

export type DocumentWithClient = Document & {
  client: Client | null
  lines: DocumentLine[]
}
