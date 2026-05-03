import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDocumentNumber } from '@/lib/utils/formatters'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('documents')
      .select(`
        *,
        client:clients(id, name, email, company),
        lines:document_lines(*)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type) query = query.eq('type', type)
    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({ documents: data, total: count, page, limit })
  } catch (error) {
    console.error('GET documents error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { type = 'invoice', client_id, title } = body

    const number = generateDocumentNumber(type)
    const today = new Date().toISOString().split('T')[0]
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        client_id: client_id || null,
        type,
        number,
        title: title || (type === 'invoice' ? 'Nouvelle facture' : 'Nouveau devis'),
        issue_date: today,
        due_date: dueDate,
        status: 'draft',
        currency: 'EUR',
        subtotal: 0,
        tax_rate: 20,
        tax_amount: 0,
        total: 0,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error('POST documents error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
