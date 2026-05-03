'use client'

import { useCallback } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import type { DocumentLine } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/utils/formatters'

export interface LineItem {
    id: string
    position: number
    description: string
    quantity: number
    unit: string
    unit_price: number
    tva_rate: number
    total_ht: number
    total_tva: number
    total_ttc: number
}

interface LineItemsTableProps {
    lines: LineItem[]
    onChange: (lines: LineItem[]) => void
    currency?: string
    readonly?: boolean
}

const TVA_RATES = [0, 5.5, 10, 20]
const UNITS = ['', 'h', 'j', 'u', 'forfait', 'm2', 'km']

function computeLine(line: LineItem): LineItem {
    const total_ht = Math.round(line.quantity * line.unit_price * 100) / 100
    const total_tva = Math.round(total_ht * (line.tva_rate / 100) * 100) / 100
    const total_ttc = Math.round((total_ht + total_tva) * 100) / 100
    return { ...line, total_ht, total_tva, total_ttc }
}

export function LineItemsTable({ lines, onChange, currency = 'EUR', readonly = false }: LineItemsTableProps) {
    const addLine = useCallback(() => {
          const newLine: LineItem = {
                  id: crypto.randomUUID(),
                  position: lines.length + 1,
                  description: '',
                  quantity: 1,
                  unit: '',
                  unit_price: 0,
                  tva_rate: 20,
                  total_ht: 0,
                  total_tva: 0,
                  total_ttc: 0,
          }
          onChange([...lines, newLine])
    }, [lines, onChange])

  const updateLine = useCallback((id: string, field: keyof LineItem, value: string | number) => {
        const updated = lines.map(l => {
                if (l.id !== id) return l
                const newLine = { ...l, [field]: value }
                        return computeLine(newLine)
        })
        onChange(updated)
  }, [lines, onChange])

  const removeLine = useCallback((id: string) => {
        onChange(lines.filter(l => l.id !== id).map((l, i) => ({ ...l, position: i + 1 })))
  }, [lines, onChange])

  const totalHT = lines.reduce((sum, l) => sum + l.total_ht, 0)
    const totalTVA = lines.reduce((sum, l) => sum + l.total_tva, 0)
    const totalTTC = totalHT + totalTVA

  const inputClass = 'w-full bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary-400 rounded px-1 py-0.5 text-sm text-gray-800'

  return (
        <div className="space-y-2">
          {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full min-w-[700px]">
                                <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                              {!readonly && <th className="w-8 px-2 py-2.5"></th>th>}
                                                          <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2.5">Description</th>th>
                                                          <th className="text-right text-xs font-semibold text-gray-500 px-3 py-2.5 w-20">Qte</th>th>
                                                          <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2.5 w-20">Unite</th>th>
                                                          <th className="text-right text-xs font-semibold text-gray-500 px-3 py-2.5 w-28">PU HT</th>th>
                                                          <th className="text-right text-xs font-semibold text-gray-500 px-3 py-2.5 w-24">TVA %</th>th>
                                                          <th className="text-right text-xs font-semibold text-gray-500 px-3 py-2.5 w-28">Total HT</th>th>
                                              {!readonly && <th className="w-8 px-2 py-2.5"></th>th>}
                                            </tr>tr>
                                </thead>thead>
                                <tbody className="divide-y divide-gray-100">
                                  {lines.map((line) => (
                        <tr key={line.id} className="hover:bg-gray-50 group">
                          {!readonly && (
                                            <td className="px-2 py-2">
                                                                <GripVertical size={14} className="text-gray-300 cursor-grab" />
                                            </td>td>
                                        )}
                                        <td className="px-3 py-2">
                                          {readonly ? (
                                              <span className="text-sm text-gray-800">{line.description}</span>span>
                                            ) : (
                                              <input
                                                                      className={inputClass}
                                                                      value={line.description}
                                                                      onChange={e => updateLine(line.id, 'description', e.target.value)}
                                                                      placeholder="Description de la prestation..."
                                                                    />
                                            )}
                                        </td>td>
                                        <td className="px-3 py-2">
                                          {readonly ? (
                                              <span className="text-sm text-gray-800 block text-right">{line.quantity}</span>span>
                                            ) : (
                                              <input
                                                                      type="number"
                                                                      className={inputClass + ' text-right'}
                                                                      value={line.quantity}
                                                                      min={0}
                                                                      step={0.01}
                                                                      onChange={e => updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                                    />
                                            )}
                                        </td>td>
                                        <td className="px-3 py-2">
                                          {readonly ? (
                                              <span className="text-sm text-gray-500">{line.unit}</span>span>
                                            ) : (
                                              <select
                                                                      className={inputClass}
                                                                      value={line.unit}
                                                                      onChange={e => updateLine(line.id, 'unit', e.target.value)}
                                                                    >
                                                {UNITS.map(u => <option key={u} value={u}>{u || '-'}</option>option>)}
                                              </select>select>
                                                          )}
                                        </td>td>
                                        <td className="px-3 py-2">
                                          {readonly ? (
                                              <span className="text-sm text-gray-800 block text-right">{formatCurrency(line.unit_price, currency)}</span>span>
                                            ) : (
                                              <input
                                                                      type="number"
                                                                      className={inputClass + ' text-right'}
                                                                      value={line.unit_price}
                                                                      min={0}
                                                                      step={0.01}
                                                                      onChange={e => updateLine(line.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                                                    />
                                            )}
                                        </td>td>
                                        <td className="px-3 py-2">
                                          {readonly ? (
                                              <span className="text-sm text-gray-500 block text-right">{line.tva_rate}%</span>span>
                                            ) : (
                                              <select
                                                                      className={inputClass + ' text-right'}
                                                                      value={line.tva_rate}
                                                                      onChange={e => updateLine(line.id, 'tva_rate', parseFloat(e.target.value))}
                                                                    >
                                                {TVA_RATES.map(r => <option key={r} value={r}>{r}%</option>option>)}
                                              </select>select>
                                                          )}
                                        </td>td>
                                        <td className="px-3 py-2 text-right">
                                                          <span className="text-sm font-medium text-gray-900">{formatCurrency(line.total_ht, currency)}</span>span>
                                        </td>td>
                          {!readonly && (
                                            <td className="px-2 py-2">
                                                                <button
                                                                                        onClick={() => removeLine(line.id)}
                                                                                        className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                                                                      >
                                                                                      <Trash2 size={13} />
                                                                </button>button>
                                            </td>td>
                                        )}
                        </tr>tr>
                      ))}
                                </tbody>tbody>
                      </table>table>
              </div>div>
        
          {/* Add line */}
          {!readonly && (
                  <button
                              onClick={addLine}
                              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors"
                            >
                            <Plus size={15} /> Ajouter une ligne
                  </button>button>
              )}
        
          {/* Totals */}
              <div className="flex justify-end mt-4">
                      <div className="w-64 space-y-1.5">
                                <div className="flex justify-between text-sm text-gray-600">
                                            <span>Total HT</span>span>
                                            <span className="font-medium">{formatCurrency(totalHT, currency)}</span>span>
                                </div>div>
                                <div className="flex justify-between text-sm text-gray-600">
                                            <span>TVA</span>span>
                                            <span className="font-medium">{formatCurrency(totalTVA, currency)}</span>span>
                                </div>div>
                                <div className="flex justify-between text-base font-bold text-gray-900 pt-1.5 border-t border-gray-200">
                                            <span>Total TTC</span>span>
                                            <span>{formatCurrency(totalTTC, currency)}</span>span>
                                </div>div>
                      </div>div>
              </div>div>
        </div>div>
      )
}

export default LineItemsTable</div>
