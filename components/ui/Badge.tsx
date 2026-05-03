import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/formatters'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline'
export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant
    size?: BadgeSize
    dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    outline: 'bg-transparent border border-gray-300 text-gray-600',
}

const dotClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    outline: 'bg-gray-400',
}

const sizeClasses: Record<BadgeSize, string> = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1',
}

export function Badge({ variant = 'default', size = 'sm', dot = false, children, className, ...props }: BadgeProps) {
    return (
          <span
                  className={cn(
                            'inline-flex items-center gap-1.5 font-medium rounded-full',
                            variantClasses[variant],
                            sizeClasses[size],
                            className
                          )}
            {...props}
                >
            {dot && (
                          <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotClasses[variant])} />
                        )}
            {children}
          </span>span>
        )
}

export default Badge</span>
