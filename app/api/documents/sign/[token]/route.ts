import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createAdminClient()

  const { data: document } = await supabase
    .from('documents')
    .select('*, client:clients(name, email), profile:profiles(full_name, company_name)')
    .eq('sign_token', params.token)
    .single()

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  return NextResponse.json({ document })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createAdminClient()
    const { signatureData } = await request.json()

    if (!signatureData) {
      return NextResponse.json({ error: 'Signature data required' }, { status: 400 })
    }

    const { data: document } = await supabase
      .from('documents')
      .select('id, status, signed_at')
      .eq('sign_token', params.token)
      .single()

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (document.signed_at) {
      return NextResponse.json({ error: 'Document already signed' }, { status: 409 })
    }

    // Get IP address
    const headersList = headers()
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

    // Update document
    await supabase
      .from('documents')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signature_data: signatureData,
        signature_ip: ip.split(',')[0].trim(),
      })
      .eq('id', document.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signature error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
