import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'FactureDoc AI - Devis & Factures par IA',
  description: 'Générez des devis et factures professionnels en quelques secondes avec l\'intelligence artificielle.',
  keywords: ['facture', 'devis', 'IA', 'SaaS', 'comptabilité', 'France'],
  authors: [{ name: 'FactureDoc AI' }],
  openGraph: {
    title: 'FactureDoc AI',
    description: 'Devis & Factures professionnels générés par IA',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={dmSans.variable}>
      <body className="font-sans antialiased bg-gray-50">
        {children}
      </body>
    </html>
  )
}
