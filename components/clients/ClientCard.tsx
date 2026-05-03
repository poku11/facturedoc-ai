'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Phone, MapPin, FileText, MoreVertical, Pencil, Trash2, Building2 } from 'lucide-react'
import type { Client } from '@/lib/supabase/types'

interface ClientCardProps {
    client: Client
    documentsCount?: number
    totalAmount?: number
    onEdit: (client: Client) => void
    onDelete: (client: Client) => void
}

export function ClientCard({ client, documentsCount = 0, totalAmount = 0, onEdit, onDelete }: ClientCardProps) {
    const router = useRouter()
    const [menuOpen, setMenuOpen] = useState(false)

  const initials = client.name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const colors = [
        'bg-blue-100 text-blue-700',
        'bg-purple-100 text-purple-700',
        'bg-emerald-100 text-emerald-700',
        'bg-amber-100 text-amber-700',
        'bg-pink-100 text-pink-700',
      ]
    const colorIndex = client.name.charCodeAt(0) % colors.length
    const avatarColor = colors[colorIndex]

  return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${avatarColor}`}>
                                  {initials}
                                </div>div>
                                <div>
                                            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                                              {client.name}
                                            </h3>h3>
                                  {client.email && (
                        <p className="text-sm text-gray-500 truncate max-w-[160px]">{client.email}</p>p>
                                            )}
                                </div>div>
                      </div>div>
                      <div className="relative">
                                <button
                                              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                            <MoreVertical size={15} />
                                </button>button>
                        {menuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                                    <button
                                                      onClick={(e) => { e.stopPropagation(); onEdit(client); setMenuOpen(false) }}
                                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                    >
                                                    <Pencil size={14} /> Modifier
                                    </button>button>
                                    <button
                                                      onClick={(e) => { e.stopPropagation(); onDelete(client); setMenuOpen(false) }}
                                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                    >
                                                    <Trash2 size={14} /> Supprimer
                                    </button>button>
                      </div>div>
                                )}
                      </div>div>
              </div>div>
        
              <div className="space-y-1.5 mb-4">
                {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Phone size={13} className="flex-shrink-0" />
                                <span>{client.phone}</span>span>
                    </div>div>
                      )}
                {(client.city || client.address) && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                <MapPin size={13} className="flex-shrink-0" />
                                <span className="truncate">{client.city ?? client.address}</span>span>
                    </div>div>
                      )}
                {client.siret && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Building2 size={13} className="flex-shrink-0" />
                                <span>SIRET: {client.siret}</span>span>
                    </div>div>
                      )}
              </div>div>
        
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                <FileText size={13} />
                                <span>{documentsCount} document{documentsCount !== 1 ? 's' : ''}</span>span>
                      </div>div>
                      <button
                                  onClick={() => router.push(`/documents?client=${client.id}`)}
                                  className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                                >
                                Voir documents
                      </button>button>
              </div>div>
        </div>div>
      )
}

export default ClientCard</div>
