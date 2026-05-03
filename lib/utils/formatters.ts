import { format, parseISO, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return ''
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return ''
    return format(d, 'dd MMMM yyyy', { locale: fr })
  } catch {
    return ''
  }
}

export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return ''
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return ''
    return format(d, 'dd/MM/yyyy')
  } catch {
    return ''
  }
}

export function formatNumber(num: number, decimals = 2): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

export function calculateLineTotal(
  quantity: number,
  unitPrice: number,
  discountPercent = 0
): number {
  const subtotal = quantity * unitPrice
  const discount = subtotal * (discountPercent / 100)
  return Math.round((subtotal - discount) * 100) / 100
}

export function calculateDocumentTotals(
  lines: Array<{ quantity: number; unit_price: number; tax_rate: number; discount_percent: number }>
) {
  let subtotal = 0
  let taxAmount = 0

  for (const line of lines) {
    const lineSubtotal = line.quantity * line.unit_price
    const discount = lineSubtotal * (line.discount_percent / 100)
    const lineNet = lineSubtotal - discount
    const lineTax = lineNet * (line.tax_rate / 100)
    subtotal += lineNet
    taxAmount += lineTax
  }

  subtotal = Math.round(subtotal * 100) / 100
  taxAmount = Math.round(taxAmount * 100) / 100
  const total = Math.round((subtotal + taxAmount) * 100) / 100

  return { subtotal, taxAmount, total }
}

export function generateDocumentNumber(type: 'invoice' | 'quote'): string {
  const prefix = type === 'invoice' ? 'FACT' : 'DEVIS'
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 9000) + 1000
  return `${prefix}-${year}-${random}`
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    sent: 'Envoyé',
    viewed: 'Vu',
    signed: 'Signé',
    paid: 'Payé',
    overdue: 'En retard',
    cancelled: 'Annulé',
  }
  return labels[status] || status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'gray',
    sent: 'blue',
    viewed: 'purple',
    signed: 'indigo',
    paid: 'green',
    overdue: 'red',
    cancelled: 'gray',
  }
  return colors[status] || 'gray'
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}
