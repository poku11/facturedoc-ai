'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Zap, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { TemplateGallery } from '@/components/documents/TemplateGallery'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import type { DocumentType } from '@/lib/supabase/types'

export default function NewDocumentPage() {
    const router = useRouter()
    const [step, setStep] = useState<'template' | 'ai' | 'creating'>('template')
    const [selectedTemplate, setSelectedTemplate] = useState<string>('')
    const [selectedType, setSelectedType] = useState<DocumentType>('devis')
    const [aiDescription, setAiDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

  const handleTemplateSelect = (templateId: string, type: DocumentType) => {
        setSelectedTemplate(templateId)
        setSelectedType(type)
  }

  const handleContinue = () => {
        if (!selectedTemplate) return
        if (selectedTemplate.startsWith('ai-')) {
                setStep('ai')
        } else {
                handleCreateBlank()
        }
  }

  const handleCreateBlank = async () => {
        setLoading(true)
        setError('')
        try {
                const res = await fetch('/api/documents', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                                      type: selectedType,
                                      templateId: selectedTemplate,
                          }),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error ?? 'Erreur creation')
                router.push(`/documents/${data.document.id}`)
        } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur')
                setLoading(false)
        }
  }

  const handleAIGenerate = async () => {
        if (!aiDescription.trim()) return
        setLoading(true)
        setError('')
        setStep('creating')
        try {
                const res = await fetch('/api/ai/generate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                                      type: selectedType,
                                      description: aiDescription,
                          }),
                })
                const data = await res.json()
                if (!res.ok) {
                          if (data.upgrade_required) {
                                      setError('Limite atteinte. Passez a un plan superieur pour continuer.')
                          } else {
                                      throw new Error(data.error ?? 'Erreur IA')
                          }
                          setStep('ai')
                          return
                }
                router.push(`/documents/${data.document.id}`)
        } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur')
                setStep('ai')
        } finally {
                setLoading(false)
        }
  }

  if (step === 'creating') {
        return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                        <div className="relative">
                                  <div className="w-20 h-20 rounded-2xl bg-purple-100 flex items-center justify-center">
                                              <Zap size={36} className="text-purple-600" />
                                  </div>div>
                                  <Loader2 className="absolute -bottom-1 -right-1 w-7 h-7 animate-spin text-purple-500 bg-white rounded-full" />
                        </div>div>
                        <div className="text-center">
                                  <h2 className="text-xl font-semibold text-gray-900">Generation en cours...</h2>h2>
                                  <p className="text-gray-500 mt-1">Claude analyse votre demande et cree votre document</p>p>
                        </div>div>
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map(i => (
                              <span key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                            ))}
                        </div>div>
                </div>div>
              )
  }
  
    return (
          <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Header */}
                <div className="mb-8">
                        <Link href="/documents" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
                                  <ArrowLeft size={15} /> Retour aux documents
                        </Link>Link>
                        <h1 className="text-2xl font-bold text-gray-900">Nouveau document</h1>h1>
                        <p className="text-gray-500 mt-1">Choisissez un template ou laissez l'IA creer votre document</p>p>
                </div>div>
          
            {step === 'template' && (
                    <div className="space-y-6">
                              <TemplateGallery onSelect={handleTemplateSelect} />
                    
                      {error && (
                                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>div>
                              )}
                    
                              <div className="flex justify-end">
                                          <Button
                                                          onClick={handleContinue}
                                                          disabled={!selectedTemplate || loading}
                                                          loading={loading}
                                                          className="flex items-center gap-2"
                                                        >
                                                        Continuer <ArrowRight size={15} />
                                          </Button>Button>
                              </div>div>
                    </div>div>
                )}
          
            {step === 'ai' && (
                    <div className="space-y-6">
                              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-3">
                                          <Zap className="text-purple-500 mt-0.5 flex-shrink-0" size={18} />
                                          <div>
                                                        <p className="text-sm font-semibold text-purple-900">Generation par IA</p>p>
                                                        <p className="text-sm text-purple-700 mt-0.5">
                                                                        Decrivez votre {selectedType} en langage naturel et Claude va le generer automatiquement.
                                                        </p>p>
                                          </div>div>
                              </div>div>
                    
                              <Textarea
                                            label="Decrivez votre document"
                                            value={aiDescription}
                                            onChange={e => setAiDescription(e.target.value)}
                                            rows={5}
                                            placeholder={`Ex: Devis pour le developpement d'un site web vitrine pour un restaurant parisien. Inclure la conception, le developpement et la maintenance pendant 1 an. Budget approximatif: 5000 euros.`}
                                          />
                    
                      {error && (
                                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>div>
                              )}
                    
                              <div className="flex justify-between">
                                          <Button variant="outline" onClick={() => setStep('template')}>
                                                        <ArrowLeft size={14} className="mr-1" /> Retour
                                          </Button>Button>
                                          <Button
                                                          onClick={handleAIGenerate}
                                                          disabled={!aiDescription.trim() || loading}
                                                          loading={loading}
                                                          className="flex items-center gap-2"
                                                        >
                                                        <Zap size={14} /> Generer avec l'IA
                                          </Button>Button>
                              </div>div>
                    </div>div>
                )}
          </div>div>
        )
}</div>
