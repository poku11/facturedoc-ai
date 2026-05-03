import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithAI } from '@/lib/ai/generateDocument'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { documentId, message } = await request.json()
    if (!documentId || !message) {
      return NextResponse.json({ error: 'Missing documentId or message' }, { status: 400 })
    }

    // Get document context
    const { data: document } = await supabase
      .from('documents')
      .select('*, lines:document_lines(*)')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    // Get chat history
    const { data: history } = await supabase
      .from('ai_chats')
      .select('role, content')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true })
      .limit(20)

    const docContext = JSON.stringify({
      type: document.type,
      number: document.number,
      total: document.total,
      lines: document.lines?.slice(0, 5),
    })

    // Save user message
    await supabase.from('ai_chats').insert({
      document_id: documentId,
      user_id: user.id,
      role: 'user',
      content: message,
    })

    // Get AI response
    const aiResponse = await chatWithAI(docContext, history || [], message)

    // Save AI response
    await supabase.from('ai_chats').insert({
      document_id: documentId,
      user_id: user.id,
      role: 'assistant',
      content: aiResponse,
    })

    return NextResponse.json({ message: aiResponse })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    if (!documentId) return NextResponse.json({ error: 'Missing documentId' }, { status: 400 })

    const { data: messages } = await supabase
      .from('ai_chats')
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
