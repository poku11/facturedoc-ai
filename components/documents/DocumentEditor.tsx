'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Send, Download, Eye, EyeOff, Loader2, Sparkles, MessageSquare, CreditCard, Trash2 } from 'lucide-react'
import type { Document, Client, Profile, AIChat as AIChatType } from '@/lib/supabase/types'
import { LineItemsTable, type LineItem } from './LineItemsTable'
import { DocumentPreview } from './DocumentPreview'
import { AIChat } from './AIChat'
import { Button } from '@/components/ui/Button'
import Input, { Textarea, Select } from '@/components/ui/Input'
import { StatusBadge } from './StatusBadge'

interface DocumentEditorProps {
    document: Document & { lines?: LineItem[] }
    profile: Profile | null
    clients: Client[]
    chatMessages?: AIChatType[]
}

export function DocumentEditor({ document: initialDoc, profile, clients, chatMessages = [] }: DocumentEditorProps) {
    const router = useRouter()
    const [doc, setDoc] = useState(initialDoc)
    const [lines, setLines] = useState<LineItem[]>(initialDoc.lines ?? [])
    const [saving, setSaving] = useState(false)
    const [sending, setSending] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [showChat, setShowChat] = useState(false)
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
    const [isDirty, setIsDirty] = useState(false)

  const totalHT = lines.reduce((s, l) => s + l.total_ht, 0)
    const totalTVA = lines.reduce((s, l) => s + l.total_tva, 0)
    const totalTTC = totalHT + totalTVA

  const updateDoc = useCallback(<K extends keyof Document>(key: K, value: Document[K]) => {
        setDoc(prev => ({ ...prev, [key]: value }))
        setIsDirty(true)
    }, [])
  
    // Auto-save debounce
    useEffect(() => {
          if (!isDirty) return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
              handleSave(true)
      }, 2000)
      return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
    }, [doc, lines, isDirty])
  
    const handleSave = useCallback(async (silent = false) => {
          if (!silent) setSaving(true)
      try {
              const payload = {
                        ...doc,
                        lines,
                        subtotal: totalHT,
          tva_amount: totalTVA,
          total: totalTTC,
    }
        await fetch(`/api/documents/${doc.id}`, {
                  method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
    })
        setIsDirty(false)
    } catch (err) {
            console.error('Save error:', err)
    } finally {
            if (!silent) setSaving(false)
    }
    }, [doc, lines, totalHT, totalTVA, totalTTC])
  
    const handleSend = useCallback(async () => {
          setSending(true)
          try {
                  await handleSave(true)
                  const res = await fetch(`/api/documents/${doc.id}/send`, { method: 'POST' })
        const data = await res.json()
        if (data.success) {
                  setDoc(prev => ({ ...prev, status: 'sent', sent_at: new Date().toISOString() }))
        }
    } catch (err) {
            console.error('Send error:', err)
    } finally {
            setSending(false)
    }
    }, [doc.id, handleSave])
  
    const handleDownloadPDF = useCallback(async () => {
          const res = await fetch(`/api/documents/${doc.id}/pdf`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = globalThis.document.createElement('a')
      a.href = url
      a.download = `${doc.number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    }, [doc.id, doc.number])
  
    const handleCreatePaymentLink = useCallback(async () => {
          const res = await fetch('/api/stripe/payment-link', {
                  method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: doc.id }),
    })
      const data = await res.json()
      if (data.url) setDoc(prev => ({ ...prev, stripe_payment_link: data.url }))
    }, [doc.id])
  
    const clientOptions = [
    { value: '', label: 'Aucun client' },
      ...clients.map(c => ({ value: c.id, label: c.name })),
    ]
  
    return (
      <div className="flex h-full gap-0">
        {/* Main editor */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Toolbar */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0 gap-2 flex-wrap">
                              <div className="flex items-center gap-3">
                                          <div>
                                                        <p className="text-sm font-semibold text-gray-900">{doc.number}</p>p>
                                                        <p className="text-xs text-gray-500 capitalize">{doc.type}</p>p>
                                          </div>div>
                                          <StatusBadge status={doc.status} />
                                {isDirty && <span className="text-xs text-amber-500">Non sauvegarde...</span>span>}
                              </div>div>
                              <div className="flex items-center gap-2">
                                          <button
                                                          onClick={() => setActiveTab(activeTab === 'edit' ? 'preview' : 'edit')}
                                                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                            {activeTab === 'edit' ? <Eye size={15} /> : <EyeOff size={15} />}
                                            {activeTab === 'edit' ? 'Apercu' : 'Editer'}
                                          </button>button>
                                          <Button onClick={handleDownloadPDF} variant="outline" size="sm">
                                                        <Download size={14} />
                                          </Button>Button>
                                          <Button
                                                          onClick={() => handleSave(false)}
                                                          variant="outline"
                                                          size="sm"
                                                          loading={saving}
                                                        >
                                                        <Save size={14} className="mr-1" /> Sauvegarder
                                          </Button>Button>
                                {doc.status === 'draft' && doc.client_id && (
                  <Button onClick={handleSend} size="sm" loading={sending}>
                                  <Send size={14} className="mr-1" /> Envoyer
                  </Button>Button>
                                          )}
                              </div>div>
                    </div>div>
            
              {/* Tabs */}
                    <div className="flex border-b border-gray-200 bg-white">
                              <button
                                            onClick={() => setActiveTab('edit')}
                                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                                                            activeTab === 'edit'
                                                              ? 'border-primary-500 text-primary-600'
                                                              : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                          >
                                          Edition
                              </button>button>
                              <button
                                            onClick={() => setActiveTab('preview')}
                                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                                                            activeTab === 'preview'
                                                              ? 'border-primary-500 text-primary-600'
                                                              : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                          >
                                          Apercu PDF
                              </button>button>
                    </div>div>
            
              {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                      {activeTab === 'edit' ? (
                <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
                  {/* Document info */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                              <Select
                                                                  label="Type"
                                                                  value={doc.type}
                                                                  onChange={e => updateDoc('type', e.target.value as Document['type'])}
                                                                  options={[
                                                                    { value: 'devis', label: 'Devis' },
                                                                    { value: 'facture', label: 'Facture' },
                                                                    { value: 'avoir', label: 'Avoir' },
                                                                                      ]}
                                                                />
                                              <Input
                                                                  label="Numero"
                                                                  value={doc.number}
                                                                  onChange={e => updateDoc('number', e.target.value)}
                                                                />
                                              <Input
                                                                  label="Date d'emission"
                                                                  type="date"
                                                                  value={doc.issue_date.substring(0, 10)}
                                                                  onChange={e => updateDoc('issue_date', e.target.value)}
                                                                />
                                              <Input
                                                                  label={doc.type === 'devis' ? 'Validite' : 'Echeance'}
                                                                  type="date"
                                                                  value={doc.due_date?.substring(0, 10) ?? ''}
                                                                  onChange={e => updateDoc('due_date', e.target.value)}
                                                                />
                              </div>div>
                
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <Select
                                                                  label="Client"
                                                                  value={doc.client_id ?? ''}
                                                                  onChange={e => updateDoc('client_id', e.target.value || null)}
                                                                  options={clientOptions}
                                                                />
                                              <Input
                                                                  label="Conditions de paiement"
                                                                  value={doc.payment_terms ?? ''}
                                                                  onChange={e => updateDoc('payment_terms', e.target.value)}
                                                                  placeholder="Ex: 30 jours nets"
                                                                />
                              </div>div>
                
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <Input
                                                                  label="Titre du document"
                                                                  value={doc.title ?? ''}
                                                                  onChange={e => updateDoc('title', e.target.value)}
                                                                  placeholder="Ex: Developpement site web"
                                                                />
                              </div>div>
                
                              <Textarea
                                                label="Description"
                                                value={doc.description ?? ''}
                                                onChange={e => updateDoc('description', e.target.value)}
                                                rows={2}
                                                placeholder="Description generale du document..."
                                              />
                
                  {/* Lines */}
                              <div>
                                              <h3 className="text-sm font-semibold text-gray-700 mb-3">Lignes</h3>h3>
                                              <LineItemsTable
                                                                  lines={lines}
                                                                  onChange={updated => { setLines(updated); setIsDirty(true) }}
                                                                  currency={doc.currency}
                                                                />
                              </div>div>
                
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <Textarea
                                                                  label="Notes"
                                                                  value={doc.notes ?? ''}
                                                                  onChange={e => updateDoc('notes', e.target.value)}
                                                                  rows={3}
                                                                  placeholder="Notes visibles par le client..."
                                                                />
                                              <Textarea
                                                                  label="Pied de page"
                                                                  value={doc.footer_text ?? ''}
                                                                  onChange={e => updateDoc('footer_text', e.target.value)}
                                                                  rows={3}
                                                                  placeholder="Mentions legales, conditions..."
                                                                />
                              </div>div>
                
                  {/* Payment link */}
                              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                              <div className="flex items-center justify-between">
                                                                <div>
                                                                                    <p className="text-sm font-medium text-gray-900">Lien de paiement Stripe</p>p>
                                                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                                                      {doc.stripe_payment_link ? doc.stripe_payment_link : 'Aucun lien genere'}
                                                                                      </p>p>
                                                                </div>div>
                                                                <Button
                                                                                      onClick={handleCreatePaymentLink}
                                                                                      variant="outline"
                                                                                      size="sm"
                                                                                      disabled={!!doc.stripe_payment_link}
                                                                                    >
                                                                                    <CreditCard size={14} className="mr-1" />
                                                                  {doc.stripe_payment_link ? 'Genere' : 'Creer'}
                                                                </Button>Button>
                                              </div>div>
                              </div>div>
                </div>div>
              ) : (
                <div className="p-4 md:p-6">
                              <DocumentPreview
                                                document={{ ...doc, lines }}
                                                profile={profile}
                                                showPayButton={!!doc.stripe_payment_link}
                                              />
                </div>div>
                              )}
                    </div>div>
            </div>div>
      
        {/* AI Chat sidebar */}
            <div className={`border-l border-gray-200 bg-white transition-all duration-300 flex-shrink-0 ${
            showChat ? 'w-80' : 'w-0 overflow-hidden'
  }`}>
              {showChat && (
              <AIChat
                            documentId={doc.id}
                            document={doc}
                            initialMessages={chatMessages}
                          />
            )}
            </div>div>
      
        {/* Chat toggle */}
            <button
                      onClick={() => setShowChat(!showChat)}
                      className={`fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${
                                  showChat
                                    ? 'bg-gray-700 text-white hover:bg-gray-800'
                                    : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
              {showChat ? <EyeOff size={18} /> : <Sparkles size={18} />}
            </button>button>
      </div>div>
    )
    }
  
  export default DocumentEditor</K>
