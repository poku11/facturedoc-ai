import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '../../../../../../lib/supabase/server'
import { generateDocumentWithAI, calculateDocumentTotals, calculateLineTotals } from '../../../../../../lib/ai/generateDocument'
import { DocumentType } from '../../../../../../lib/supabase/types'
import { addDays, format } from 'date-fns'

export async function POST(request: NextRequest) {
    try {
          const supabase = createServerClient()

      const { data: { user }, error: authError } = await supabase.auth.getUser()
          if (authError || !user) {
                  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
          }

      // Get user profile for limits and context
      const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

      if (profileError || !profile) {
              return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      const body = await request.json()
          const { type, description, clientId } = body as {
                  type: DocumentType
                  description: string
                  clientId?: string
          }

      if (!type || !description) {
              return NextResponse.json({ error: 'type and description are required' }, { status: 400 })
      }

      // Get client info if provided
      let clientInfo: string | undefined
          let clientData = null
          if (clientId) {
                  const { data: client } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('id', clientId)
                    .eq('user_id', user.id)
                    .single()

            if (client) {
                      clientData = client
                      clientInfo = `Nom: ${client.name}, Email: ${client.email || 'N/A'}, Ville: ${client.city || 'N/A'}`
            }
          }

      const companyInfo = profile.company_name
            ? `Entreprise: ${profile.company_name}, SIRET: ${profile.company_siret || 'N/A'}, TVA: ${profile.company_tva || 'N/A'}`
              : undefined

      // Generate with AI
      const generated = await generateDocumentWithAI({
              type,
              userDescription: description,
              clientInfo,
              companyInfo,
      })

      // Generate document number
      const { data: docNumber } = await supabase
            .rpc('generate_document_number', { p_user_id: user.id, p_type: type })

      // Calculate totals
      const totals = calculateDocumentTotals(generated.lines)
          const issueDate = new Date()
          const dueDate = type === 'facture' ? addDays(issueDate, generated.due_days) : null
          const validityDate = type === 'devis' ? addDays(issueDate, generated.validity_days) : null

      // Create document
      const { data: document, error: docError } = await supabase
            .from('documents')
            .insert({
                      user_id: user.id,
                      client_id: clientId || null,
                      type,
                      status: 'draft',
                      number: docNumber || `${type.toUpperCase()}-${Date.now()}`,
                      title: generated.title,
                      description: generated.description,
                      issue_date: format(issueDate, 'yyyy-MM-dd'),
                      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
                      validity_date: validityDate ? format(validityDate, 'yyyy-MM-dd') : null,
                      subtotal: totals.subtotal,
                      tva_rate: 20,
                      tva_amount: totals.tva_amount,
                      total: totals.total,
                      payment_terms: generated.payment_terms,
                      notes: generated.notes,
                      footer_text: generated.footer_text,
                      ai_generated: true,
            })
            .select('*')
            .single()

      if (docError || !document) {
              console.error('Error creating document:', docError)
              return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
      }

      // Create document lines
      const lineInserts = generated.lines.map((line, index) => {
              const lineTotals = calculateLineTotals(line)
              return {
                        document_id: document.id,
                        position: index,
                        description: line.description,
                        quantity: line.quantity,
                        unit: line.unit,
                        unit_price: line.unit_price,
                        tva_rate: line.tva_rate,
                        ...lineTotals,
              }
      })

      const { data: lines, error: linesError } = await supabase
            .from('document_lines')
            .insert(lineInserts)
            .select('*')

      if (linesError) {
              console.error('Error creating lines:', linesError)
      }

      return NextResponse.json({
              document: { ...document, client: clientData, lines: lines || [] },
              generated,
      })
    } catch (error) {
          console.error('AI generation error:', error)
          return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
                )
    }
}
