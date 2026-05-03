'use client'

import { useState } from 'react'
import { FileText, Zap, CheckCircle2 } from 'lucide-react'
import type { DocumentType } from '@/lib/supabase/types'

interface Template {
    id: string
    name: string
    description: string
    type: DocumentType | 'all'
    isAI?: boolean
    preview?: string
}

const SYSTEM_TEMPLATES: Template[] = [
  {
        id: 'blank',
        name: 'Document vierge',
        description: 'Commencez avec un document vide',
        type: 'all',
  },
  {
        id: 'ai-devis',
        name: 'Devis par IA',
        description: "L'IA genere votre devis en quelques secondes",
        type: 'devis',
        isAI: true,
  },
  {
        id: 'ai-facture',
        name: 'Facture par IA',
        description: "L'IA complete votre facture automatiquement",
        type: 'facture',
        isAI: true,
  },
  {
        id: 'standard-devis',
        name: 'Devis standard',
        description: 'Template professionnel avec TVA',
        type: 'devis',
  },
  {
        id: 'standard-facture',
        name: 'Facture standard',
        description: 'Facture classique avec mentions legales',
        type: 'facture',
  },
  {
        id: 'avoir',
        name: 'Avoir',
        description: 'Note de credit ou remboursement',
        type: 'avoir',
  },
  ]

interface TemplateGalleryProps {
    onSelect: (templateId: string, type: DocumentType) => void
    selectedType?: DocumentType
}

export function TemplateGallery({ onSelect, selectedType }: TemplateGalleryProps) {
    const [selected, setSelected] = useState<string | null>(null)
    const [filter, setFilter] = useState<DocumentType | 'all'>('all')

  const filtered = SYSTEM_TEMPLATES.filter(t =>
        filter === 'all' || t.type === 'all' || t.type === filter
                                             )

  const handleSelect = (template: Template) => {
        setSelected(template.id)
        const docType: DocumentType = template.type === 'all' ? 'devis' : template.type as DocumentType
        onSelect(template.id, docType)
  }

  return (
        <div className="space-y-4">
          {/* Filter tabs */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                {(['all', 'devis', 'facture', 'avoir'] as const).map(f => (
                    <button
                                  key={f}
                                  onClick={() => setFilter(f)}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                                                  filter === f
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                  }`}
                                >
                      {f === 'all' ? 'Tous' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>button>
                  ))}
              </div>div>
        
          {/* Templates grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map(template => (
                    <button
                                  key={template.id}
                                  onClick={() => handleSelect(template)}
                                  className={`relative text-left p-4 rounded-xl border-2 transition-all hover:shadow-sm ${
                                                  selected === template.id
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-gray-200 bg-white hover:border-primary-300'
                                  }`}
                                >
                      {selected === template.id && (
                                                <CheckCircle2 size={18} className="absolute top-3 right-3 text-primary-500" />
                                              )}
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                                                template.isAI ? 'bg-purple-100' : 'bg-gray-100'
                                }`}>
                                  {template.isAI ? (
                                                  <Zap size={18} className="text-purple-600" />
                                                ) : (
                                                  <FileText size={18} className="text-gray-500" />
                                                )}
                                </div>div>
                                <h3 className="font-medium text-gray-900 text-sm">{template.name}</h3>h3>
                                <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>p>
                      {template.isAI && (
                                                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                                                <Zap size={10} /> IA
                                                </span>span>
                                )}
                    </button>button>
                  ))}
              </div>div>
        </div>div>
      )
}

export default TemplateGallery</div>
