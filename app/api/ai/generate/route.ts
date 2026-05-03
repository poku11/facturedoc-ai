import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDocument } from '@/lib/ai/generateDocument'
import { generateDocumentNumber, calculateDocumentTotals } from '@/lib/utils/formatters'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, userInput, clientId } = await request.json()

    if (!type || !userInput) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check plan limits
    const limits = { free: 5, starter: 50, pro: 500, business: Infinity }
    const limit = limits[profile.plan as keyof typeof limits]
    if (profile.documents_count >= limit) {
      return NextResponse.json({
        error: 'Limite de documents atteinte. Passez à un plan supérieur.',
        upgrade_required: true,
      }, { status: 403 })
    }

    // Get client if specified
    let client = null
    if (clientId) {
      const { data } = await supabase.from('clients').select('*').eq('id', clientId).single()
      client = data
    }

    // Generate document with AI
    const generated = await generateDocument({ type, userInput, profile, client, userId: user.id })

    // Calculate totals
    const { subtotal, taxAmount, total } = calculateDocumentTotals(generated.lines)

    // Save document to database
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        client_id: clientId || null,
        type,
        number: generated.number || generateDocumentNumber(type),
        title: generated.title,
        issue_date: generated.issue_date,
        due_date: generated.due_date,
        currency: generated.currency || 'EUR',
        subtotal,
        tax_rate: 20,
        tax_amount: taxAmount,
        total,
        notes: generated.notes,
        terms: generated.terms,
        payment_instructions: generated.payment_instructions,
        ai_generated: true,
        status: 'draft',
      })
      .select()
      .single()

    if (docError) throw docError

    // Save document lines
    if (generated.lines.length > 0) {
      const lines = generated.lines.map((line, idx) => ({
        document_id: document.id,
        sort_order: idx,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit || 'unité',
        unit_price: line.unit_price,
        tax_rate: line.tax_rate || 20,
        discount_percent: line.discount_percent || 0,
        total: line.total || line.quantity * line.unit_price,
      }))

      const { error: linesError } = await supabase.from('document_lines').insert(lines)
      if (linesError) throw linesError
    }

    // Update documents count
    await supabase
      .from('profiles')
      .update({ documents_count: profile.documents_count + 1 })
      .eq('id', user.id)

    return NextResponse.json({ document, success: true })
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du document' },
      { status: 500 }
    )
  }
}
