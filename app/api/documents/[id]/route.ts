import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
    request: NextRequest,
  { params }: { params: { id: string } }
  ) {
    try {
          const supabase = createClient()
          const { data: { user }, error: authError } = await supabase.auth.getUser()
          if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const { data: document, error } = await supabase
            .from('documents')
            .select(`*, client:clients(*), lines:document_lines(*)`)
            .eq('id', params.id)
            .eq('user_id', user.id)
            .single()

      if (error || !document) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      const sortedDocument = {
              ...document,
              lines: (document.lines ?? []).sort((a: { position: number }, b: { position: number }) => a.position - b.position),
      }

      return NextResponse.json({ document: sortedDocument })
    } catch (error) {
          console.error('GET document error:', error)
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
  { params }: { params: { id: string } }
  ) {
    try {
          const supabase = createClient()
          const { data: { user }, error: authError } = await supabase.auth.getUser()
          if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const body = await request.json()
          const { lines, ...docData } = body

      // Verify ownership
      const { data: existing } = await supabase
            .from('documents')
            .select('id')
            .eq('id', params.id)
            .eq('user_id', user.id)
            .single()
          if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      // Update document
      const { data: document, error: docError } = await supabase
            .from('documents')
            .update({
                      type: docData.type,
                      title: docData.title,
                      description: docData.description,
                      client_id: docData.client_id,
                      issue_date: docData.issue_date,
                      due_date: docData.due_date,
                      validity_date: docData.validity_date,
                      payment_terms: docData.payment_terms,
                      notes: docData.notes,
                      footer_text: docData.footer_text,
                      subtotal: docData.subtotal,
                      tva_rate: docData.tva_rate,
                      tva_amount: docData.tva_amount,
                      total: docData.total,
                      currency: docData.currency,
                      updated_at: new Date().toISOString(),
            })
            .eq('id', params.id)
            .eq('user_id', user.id)
            .select()
            .single()

      if (docError) {
              console.error('Update document error:', docError)
              return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
      }

      // Update lines if provided
      if (lines && Array.isArray(lines)) {
              // Delete existing lines
            await supabase.from('document_lines').delete().eq('document_id', params.id)

            // Insert new lines
            if (lines.length > 0) {
                      const lineInserts = lines.map((line: any, index: number) => ({
                                  document_id: params.id,
                                  position: index,
                                  description: line.description,
                                  quantity: line.quantity,
                                  unit: line.unit ?? '',
                                  unit_price: line.unit_price,
                                  tva_rate: line.tva_rate,
                                  total_ht: line.total_ht,
                                  total_tva: line.total_tva,
                                  total_ttc: line.total_ttc,
                      }))
                      await supabase.from('document_lines').insert(lineInserts)
            }
      }

      return NextResponse.json({ document })
    } catch (error) {
          console.error('PUT document error:', error)
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
  { params }: { params: { id: string } }
  ) {
    try {
          const supabase = createClient()
          const { data: { user }, error: authError } = await supabase.auth.getUser()
          if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      // Verify ownership before delete
      const { data: existing } = await supabase
            .from('documents')
            .select('id, status')
            .eq('id', params.id)
            .eq('user_id', user.id)
            .single()
          if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      // Delete lines first (cascade)
      await supabase.from('document_lines').delete().eq('document_id', params.id)
          await supabase.from('ai_chats').delete().eq('document_id', params.id)
          await supabase.from('email_logs').delete().eq('document_id', params.id)

      const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', params.id)
            .eq('user_id', user.id)

      if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })

      return NextResponse.json({ success: true })
    } catch (error) {
          console.error('DELETE document error:', error)
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
