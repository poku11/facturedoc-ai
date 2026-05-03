import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '../../../../lib/supabase/server'
import { DocumentType, DocumentStatus } from '../../../../lib/supabase/types'
import { calculateDocumentTotals, calculateLineTotals } from '../../../../lib/ai/generateDocument'
import { format, addDays } from 'date-fns'

export async function GET(request: NextRequest) {
    try {
          const supabase = createServerClient()
          const { data: { user }, error: authError } = await supabase.auth.getUser()
          if (authError || !user) {
                  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
          }

      const { searchParams } = new URL(request.url)
          const type = searchParams.get('type') as DocumentType | null
          const status = searchParams.get('status') as DocumentStatus | null
          const clientId = searchParams.get('clientId')
          const search = searchParams.get('search')
          const page = parseInt(searchParams.get('page') || '1')
          const limit = parseInt(searchParams.get('limit') || '20')
          const offset = (page - 1) * limit

      let query = supabase
            .from('documents')
            .select(`
                    *,
                            client:clients(id, name, email, city),
                                    lines:document_lines(*)
                                          `, { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

      if (type) query = query.eq('type', type)
          if (status) query = query.eq('status', status)
          if (clientId) query = query.eq('client_id', clientId)
          if (search) {
                  query = query.or(`number.ilike.%${search}%,title.ilike.%${search}%`)
          }

      const { data: documents, error, count } = await query

      if (error) {
              return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
              documents: documents || [],
              total: count || 0,
              page,
              limit,
      })
    } catch (error) {
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
          const supabase = createServerClient()
          const { data: { user }, error: authError } = await supabase.auth.getUser()
          if (authError || !user) {
                  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
          }

      const body = await request.json()
          const { type, clientId, title, lines = [], notes, payment_terms, footer_text, tva_rate = 20 } = body as {
                  type: DocumentType
                  clientId?: string
                  title?: string
                  lines?: Array<{ description: string; quantity: number; unit: string; unit_price: number; tva_rate: number }>
                  notes?: string
                  payment_terms?: string
                  footer_text?: string
                  tva_rate?: number
          }

      if (!type) {
              return NextResponse.json({ error: 'type is required' }, { status: 400 })
      }

      // Generate document number
      const { data: docNumber } = await supabase
            .rpc('generate_document_number', { p_user_id: user.id, p_type: type })

      // Calculate totals from lines
      const totals = lines.length > 0 ? calculateDocumentTotals(lines) : { subtotal: 0, tva_amount: 0, total: 0 }

      const issueDate = new Date()
          const dueDate = type === 'facture' ? addDays(issueDate, 30) : null
          const validityDate = type === 'devis' ? addDays(issueDate, 30) : null

      const { data: document, error: docError } = await supabase
            .from('documents')
            .insert({
                      user_id: user.id,
                      client_id: clientId || null,
                      type,
                      status: 'draft',
                      number: docNumber || `${type.toUpperCase()}-${Date.now()}`,
                      title: title || null,
                      issue_date: format(issueDate, 'yyyy-MM-dd'),
                      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
                      validity_date: validityDate ? format(validityDate, 'yyyy-MM-dd') : null,
                      subtotal: totals.subtotal,
                      tva_rate,
                      tva_amount: totals.tva_amount,
                      total: totals.total,
                      notes: notes || null,
                      payment_terms: payment_terms || 'Paiement à 30 jours',
                      footer_text: footer_text || null,
            })
            .select('*, client:clients(*)')
            .single()

      if (docError || !document) {
              return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
      }

      // Create lines if provided
      let createdLines: unknown[] = []
            if (lines.length > 0) {
                    const lineInserts = lines.map((line, index) => {
                              const lineTotals = calculateLineTotals(line)
                              return {
                                          document_id: document.id,
                                          position: index,
                                          ...line,
                                          ...lineTotals,
                              }
                    })

            const { data: linesData } = await supabase
                      .from('document_lines')
                      .insert(lineInserts)
                      .select('*')

            createdLines = linesData || []
            }

      return NextResponse.json({ document: { ...document, lines: createdLines } }, { status: 201 })
    } catch (error) {
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
