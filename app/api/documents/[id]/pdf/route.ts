import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '../../../../../../lib/supabase/server'
import { generatePDFBuffer } from '../../../../../../lib/pdf/generatePDF'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
          const supabase = createServerClient()
          const { data: { user }, error: authError } = await supabase.auth.getUser()
          if (authError || !user) {
                  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
                }

          const { data: document, error: docError } = await supabase
            .from('documents')
            .select(`
                            *,
                            client:clients(*),
                            lines:document_lines(*)
                          `)
            .eq('id', params.id)
            .eq('user_id', user.id)
            .single()

          if (docError || !document) {
                  return NextResponse.json({ error: 'Document not found' }, { status: 404 })
                }

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileError || !profile) {
                  return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
                }

          // Sort lines by position
          if (document.lines) {
                  document.lines.sort((a: { position: number }, b: { position: number }) => a.position - b.position)
                }

          const pdfBuffer = await generatePDFBuffer(document, profile)

          const filename = `${document.number.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`

          return new NextResponse(pdfBuffer, {
                  headers: {
                            'Content-Type': 'application/pdf',
                            'Content-Disposition': `attachment; filename="${filename}"`,
                            'Content-Length': pdfBuffer.length.toString(),
                          },
                })
        } catch (error) {
          console.error('PDF generation error:', error)
          return NextResponse.json(
                  { error: error instanceof Error ? error.message : 'PDF generation failed' },
                  { status: 500 }
                )
        }
  }
