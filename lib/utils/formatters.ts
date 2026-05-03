import { format, parseISO, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'

export function formatCurrency(amount: number, currency = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
    }).format(amount)
}

export function formatNumber(num: number, decimals = 2): string {
    return new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
    }).format(num)
}

export function formatDate(date: string | Date, formatStr = 'dd/MM/yyyy'): string {
    if (!date) return ''
    try {
          const d = typeof date === 'string' ? parseISO(date) : date
          return format(d, formatStr, { locale: fr })
    } catch {
          return ''
    }
}

export function formatDateLong(date: string | Date): string {
    return formatDate(date, 'dd MMMM yyyy')
}

export function formatDatetime(date: string | Date): string {
    return formatDate(date, 'dd/MM/yyyy HH:mm')
}

export function getDaysUntilDue(dueDate: string): number {
    if (!dueDate) return 0
    try {
          const due = parseISO(dueDate)
          const today = new Date()
          return differenceInDays(due, today)
    } catch {
          return 0
    }
}

export function getDaysOverdue(dueDate: string): number {
    const days = getDaysUntilDue(dueDate)
    return days < 0 ? Math.abs(days) : 0
}

export function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
          draft: 'Brouillon',
          sent: 'Envoyé',
          viewed: 'Vu',
          signed: 'Signé',
          paid: 'Payé',
          cancelled: 'Annulé',
          overdue: 'En retard',
    }
    return labels[status] || status
}

export function getDocumentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
          devis: 'Devis',
          facture: 'Facture',
          avoir: 'Avoir',
    }
    return labels[type] || type
}

export function truncate(str: string, maxLength: number): string {
    if (!str) return ''
    if (str.length <= maxLength) return str
    return str.substring(0, maxLength) + '...'
}

export function slugify(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
}

export function generateViewUrl(token: string, baseUrl?: string): string {
    const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || ''
    return `${base}/view/${token}`
}

export function generateSignUrl(token: string, baseUrl?: string): string {
    const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || ''
    return `${base}/sign/${token}`
}

export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ')
}

export function getInitials(name: string): string {
    if (!name) return '?'
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
