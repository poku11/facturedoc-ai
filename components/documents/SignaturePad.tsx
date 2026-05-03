'use client'

import { useRef, useState, useCallback } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Trash2, RotateCcw, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface SignaturePadProps {
    onSave: (signatureDataUrl: string) => void
    onCancel?: () => void
    loading?: boolean
}

export function SignaturePad({ onSave, onCancel, loading = false }: SignaturePadProps) {
    const sigCanvasRef = useRef<SignatureCanvas>(null)
    const [isEmpty, setIsEmpty] = useState(true)
    const [mode, setMode] = useState<'draw' | 'type'>('draw')
    const [typedName, setTypedName] = useState('')

  const handleClear = useCallback(() => {
        sigCanvasRef.current?.clear()
        setIsEmpty(true)
  }, [])

  const handleEnd = useCallback(() => {
        if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
                setIsEmpty(false)
        }
  }, [])

  const handleSave = useCallback(() => {
        if (mode === 'draw') {
                if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) return
                const dataUrl = sigCanvasRef.current.toDataURL('image/png')
                onSave(dataUrl)
        } else {
                if (!typedName.trim()) return
                const canvas = document.createElement('canvas')
                canvas.width = 400
                canvas.height = 120
                const ctx = canvas.getContext('2d')!
                ctx.fillStyle = 'white'
                ctx.fillRect(0, 0, 400, 120)
                ctx.fillStyle = '#1e293b'
                ctx.font = 'italic 48px Georgia, serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(typedName, 200, 60)
                onSave(canvas.toDataURL('image/png'))
        }
  }, [mode, typedName, onSave])

  return (
        <div className="space-y-4">
          {/* Mode tabs */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
                      <button
                                  onClick={() => setMode('draw')}
                                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                                                mode === 'draw' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                                  }`}
                                >
                                Dessiner
                      </button>button>
                      <button
                                  onClick={() => setMode('type')}
                                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                                                mode === 'type' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                                  }`}
                                >
                                Taper
                      </button>button>
              </div>div>
        
          {mode === 'draw' ? (
                  <div className="space-y-2">
                            <div className="border-2 border-dashed border-gray-300 rounded-xl bg-white overflow-hidden">
                                        <SignatureCanvas
                                                        ref={sigCanvasRef}
                                                        onEnd={handleEnd}
                                                        canvasProps={{
                                                                          width: 500,
                                                                          height: 150,
                                                                          className: 'signature-canvas w-full',
                                                        }}
                                                        backgroundColor="white"
                                                        penColor="#1e293b"
                                                      />
                            </div>div>
                            <p className="text-xs text-gray-400 text-center">Signez avec votre souris ou votre doigt</p>p>
                  </div>div>
                ) : (
                  <div className="space-y-2">
                            <input
                                          type="text"
                                          value={typedName}
                                          onChange={(e) => { setTypedName(e.target.value); setIsEmpty(!e.target.value.trim()) }}
                                          placeholder="Tapez votre nom complet"
                                          className="w-full border-2 border-dashed border-gray-300 rounded-xl bg-white px-4 py-3 text-center text-3xl italic font-serif placeholder:text-gray-300 placeholder:text-base focus:outline-none focus:border-primary-400"
                                          style={{ fontFamily: 'Georgia, serif' }}
                                        />
                            <p className="text-xs text-gray-400 text-center">Votre signature tapee a valeur legale</p>p>
                  </div>div>
              )}
        
          {/* Legal notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-700">
                                En signant, vous acceptez que cette signature electronique a la meme valeur juridique
                                qu'une signature manuscrite conformement au reglement eIDAS.
                      </p>p>
              </div>div>
        
          {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                      <div className="flex gap-2">
                        {mode === 'draw' && (
                      <button
                                      onClick={handleClear}
                                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                    <Trash2 size={14} /> Effacer
                      </button>button>
                                )}
                        {onCancel && (
                      <button
                                      onClick={onCancel}
                                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                    Annuler
                      </button>button>
                                )}
                      </div>div>
                      <Button
                                  onClick={handleSave}
                                  disabled={isEmpty}
                                  loading={loading}
                                  variant="primary"
                                  className="flex items-center gap-2"
                                >
                                <Check size={16} /> Valider la signature
                      </Button>Button>
              </div>div>
        </div>div>
      )
}

export default SignaturePad</div>
