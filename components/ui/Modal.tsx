'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/formatters'

export interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
    children: ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    hideCloseButton?: boolean
    className?: string
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
}

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    hideCloseButton = false,
    className,
}: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
                document.addEventListener('keydown', handleKeyDown)
                document.body.style.overflow = 'hidden'
        }
        return () => {
                document.removeEventListener('keydown', handleKeyDown)
                document.body.style.overflow = ''
        }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
        <div
                ref={overlayRef}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
              >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <div
                        className={cn(
                                    'relative w-full bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]',
                                    sizeClasses[size],
                                    className
                                  )}
                      >
                {(title || !hideCloseButton) && (
                                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                              <div>
                                                {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>h2>}
                                                {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>p>}
                                              </div>div>
                                    {!hideCloseButton && (
                                                  <button
                                                                    onClick={onClose}
                                                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                                                  >
                                                                  <X size={18} />
                                                  </button>button>
                                              )}
                                  </div>div>
                      )}
                      <div className="overflow-y-auto flex-1 px-6 py-4">
                        {children}
                      </div>div>
              </div>div>
        </div>div>
      )
}

export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
    return (
          <div className={cn('px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3', className)}>
            {children}
          </div>div>
        )
}

export default Modal</div>
