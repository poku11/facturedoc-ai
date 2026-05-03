import type { DocumentStatus } from '@/lib/supabase/types'

interface StatusBadgeProps {
    status: DocumentStatus
    size?: 'sm' | 'md'
}

const statusConfig: Record<DocumentStatus, { label: string; className: string; dot: string }> = {
    draft: {
          label: 'Brouillon',
          className: 'bg-gray-100 text-gray-700',
          dot: 'bg-gray-400',
    },
    sent: {
          label: 'Envoye',
          className: 'bg-blue-100 text-blue-700',
          dot: 'bg-blue-500',
    },
    viewed: {
          label: 'Vu',
          className: 'bg-indigo-100 text-indigo-700',
          dot: 'bg-indigo-500',
    },
    signed: {
          label: 'Signe',
          className: 'bg-purple-100 text-purple-700',
          dot: 'bg-purple-500',
    },
    paid: {
          label: 'Paye',
          className: 'bg-emerald-100 text-emerald-700',
          dot: 'bg-emerald-500',
    },
    cancelled: {
          label: 'Annule',
          className: 'bg-red-100 text-red-700',
          dot: 'bg-red-500',
    },
    overdue: {
          label: 'En retard',
          className: 'bg-amber-100 text-amber-700',
          dot: 'bg-amber-500',
    },
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
    const config = statusConfig[status]
    const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
    const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1'
    const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'

  return (
        <span
                className={`inline-flex items-center gap-1.5 font-medium rounded-full ${config.className} ${textSize} ${padding}`}
              >
              <span className={`${dotSize} rounded-full flex-shrink-0 ${config.dot}`} />
          {config.label}
        </span>span>
      )
}

export default StatusBadge</span>
