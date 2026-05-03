import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DocumentEditor } from '@/components/documents/DocumentEditor'

interface PageProps {
    params: { id: string }
}

export default async function DocumentPage({ params }: PageProps) {
    const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

  const { data: document, error } = await supabase
      .from('documents')
      .select(`
            *,
                  client:clients(*),
                        lines:document_lines(*)
                            `)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

  if (error || !document) notFound()

  const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

  const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

  const { data: chatMessages } = await supabase
      .from('ai_chats')
      .select('*')
      .eq('document_id', params.id)
      .eq('user_id', user.id)
      .order('created_at')

  // Sort lines by position
  const sortedDocument = {
        ...document,
        lines: (document.lines ?? []).sort((a: { position: number }, b: { position: number }) => a.position - b.position),
  }

  return (
        <div className="h-full flex flex-col">
              <DocumentEditor
                        document={sortedDocument}
                        profile={profile}
                        clients={clients ?? []}
                        chatMessages={chatMessages ?? []}
                      />
        </div>div>
      )
}

export async function generateMetadata({ params }: PageProps) {
    const supabase = createClient()
        const { data: document } = await supabase
              .from('documents')
              .select('number, type, title')
              .eq('id', params.id)
              .single()
          
            if (!document) return { title: 'Document' }
              
                return {
                      title: `${document.number} - ${document.title ?? document.type} | FactureDoc AI`,
                }
}</div>
