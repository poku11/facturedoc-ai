import React from 'react'
import {
    Document as PDFDocument,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
    renderToBuffer,
} from '@react-pdf/renderer'
import { Document, Profile } from '../supabase/types'
import { formatCurrency, formatDate } from '../utils/formatters'

// Register fonts
Font.register({
    family: 'Helvetica',
    fonts: [
      { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf', fontWeight: 'normal' },
      { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc9.ttf', fontWeight: 'bold' },
        ],
})

const styles = StyleSheet.create({
    page: {
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          padding: 40,
          fontFamily: 'Helvetica',
          fontSize: 9,
          color: '#1f2937',
    },
    header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 32,
          paddingBottom: 24,
          borderBottomWidth: 2,
          borderBottomColor: '#1A56DB',
    },
    companyInfo: {
          flex: 1,
    },
    companyName: {
          fontSize: 20,
          fontWeight: 'bold',
          color: '#1A56DB',
          marginBottom: 6,
    },
    companyDetail: {
          fontSize: 9,
          color: '#6b7280',
          marginBottom: 2,
    },
    documentInfo: {
          alignItems: 'flex-end',
    },
    documentType: {
          fontSize: 24,
          fontWeight: 'bold',
          color: '#1f2937',
          textTransform: 'uppercase',
    },
    documentNumber: {
          fontSize: 11,
          color: '#6b7280',
          marginTop: 4,
    },
    documentStatus: {
          marginTop: 8,
          backgroundColor: '#dcfce7',
          color: '#166534',
          padding: '4 10',
          borderRadius: 4,
          fontSize: 9,
          fontWeight: 'bold',
    },
    metaSection: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 28,
    },
    clientSection: {
          flex: 1,
          backgroundColor: '#f8faff',
          padding: 16,
          borderRadius: 6,
          marginRight: 12,
    },
    datesSection: {
          flex: 1,
          padding: 16,
    },
    sectionTitle: {
          fontSize: 9,
          fontWeight: 'bold',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 8,
    },
    clientName: {
          fontSize: 12,
          fontWeight: 'bold',
          marginBottom: 4,
    },
    clientDetail: {
          fontSize: 9,
           color: '#4b5563',
          marginBottom: 2,
    },
    dateRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 6,
    },
    dateLabel: {
          fontSize: 9,
          color: '#6b7280',
    },
    dateValue: {
          fontSize: 9,
          fontWeight: 'bold',
    },
    tableHeader: {
          flexDirection: 'row',
          backgroundColor: '#1A56DB',
          padding: '8 12',
          borderRadius: 4,
          marginBottom: 2,
    },
    tableHeaderText: {
          color: '#ffffff',
          fontSize: 9,
          fontWeight: 'bold',
          textTransform: 'uppercase',
    },
    tableRow: {
          flexDirection: 'row',
          padding: '8 12',
          borderBottomWidth: 1,
          borderBottomColor: '#f3f4f6',
    },
    tableRowAlt: {
          backgroundColor: '#f9fafb',
    },
    colDescription: { flex: 4 },
    colQty: { flex: 1, textAlign: 'right' },
    colUnit: { flex: 1, textAlign: 'right' },
    colPrice: { flex: 1.5, textAlign: 'right' },
    colTva: { flex: 1, textAlign: 'right' },
    colTotal: { flex: 1.5, textAlign: 'right' },
    totalsSection: {
          marginTop: 16,
          alignItems: 'flex-end',
    },
    totalRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 4,
          width: 220,
    },
    totalLabel: {
          fontSize: 9,
          color: '#6b7280',
    },
    totalValue: {
          fontSize: 9,
          fontWeight: 'bold',
    },
    totalFinal: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          backgroundColor: '#1A56DB',
          padding: '10 14',
          borderRadius: 6,
          marginTop: 8,
          width: 220,
    },
    totalFinalLabel: {
          fontSize: 12,
          fontWeight: 'bold',
          color: '#ffffff',
    },
    totalFinalValue: {
          fontSize: 12,
          fontWeight: 'bold',
          color: '#ffffff',
    },
    notesSection: {
          marginTop: 24,
          padding: 14,
          backgroundColor: '#fffbeb',
          borderLeftWidth: 3,
          borderLeftColor: '#f59e0b',
          borderRadius: 2,
    },
    footer: {
          position: 'absolute',
          bottom: 30,
          left: 40,
          right: 40,
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingTop: 12,
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: 8,
    },
    paymentTerms: {
          marginTop: 16,
          fontSize: 9,
          color: '#6b7280',
    },
    signatureSection: {
          marginTop: 24,
          padding: 14,
          borderWidth: 1,
          borderColor: '#e5e7eb',
          borderRadius: 6,
    },
})

interface PDFDocumentProps {
    document: Document
    profile: Profile
}

function FactureDocPDF({ document, profile }: PDFDocumentProps) {
    const docTypeLabel = document.type === 'devis' ? 'DEVIS' : document.type === 'facture' ? 'FACTURE' : 'AVOIR'
    const companyName = profile.company_name || profile.full_name || ''
    const lines = document.lines || []

        return React.createElement(PDFDocument, null,
                                       React.createElement(Page, { size: 'A4', style: styles.page },
                                                                 // Header
                                                                 React.createElement(View, { style: styles.header },
                                                                                             React.createElement(View, { style: styles.companyInfo },
                                                                                                                           React.createElement(Text, { style: styles.companyName }, companyName),
                                                                                                                           profile.company_address && React.createElement(Text, { style: styles.companyDetail }, profile.company_address),
                                                                                                                           (profile.company_zip || profile.company_city) && React.createElement(Text, { style: styles.companyDetail }, `${profile.company_zip || ''} ${profile.company_city || ''}`),
                                                                                                                           profile.company_email && React.createElement(Text, { style: styles.companyDetail }, profile.company_email),
                                                                                                                           profile.company_phone && React.createElement(Text, { style: styles.companyDetail }, profile.company_phone),
                                                                                                                           profile.company_siret && React.createElement(Text, { style: styles.companyDetail }, `SIRET: ${profile.company_siret}`),
                                                                                                                           profile.company_tva && React.createElement(Text, { style: styles.companyDetail }, `TVA: ${profile.company_tva}`)
                                                                                                                         ),
                                                                                             React.createElement(View, { style: styles.documentInfo },
                                                                                                                           React.createElement(Text, { style: styles.documentType }, docTypeLabel),
                                                                                                                           React.createElement(Text, { style: styles.documentNumber }, document.number)
                                                                                                                         )
                                                                                           ),

                                                                 // Meta: Client + Dates
                                                                 React.createElement(View, { style: styles.metaSection },
                                                                                             React.createElement(View, { style: styles.clientSection },
                                                                                                                           React.createElement(Text, { style: styles.sectionTitle }, 'Client'),
                                                                                                                           document.client && React.createElement(Text, { style: styles.clientName }, document.client.name),
                                                                                                                           document.client?.address && React.createElement(Text, { style: styles.clientDetail }, document.client.address),
                                                                                                                           (document.client?.zip || document.client?.city) && React.createElement(Text, { style: styles.clientDetail }, `${document.client.zip || ''} ${document.client.city || ''}`),
                                                                                                                           document.client?.email && React.createElement(Text, { style: styles.clientDetail }, document.client.email),
                                                                                                                           document.client?.siret && React.createElement(Text, { style: styles.clientDetail }, `SIRET: ${document.client.siret}`)
                                                                                                                         ),
                                                                                             React.createElement(View, { style: styles.datesSection },
                                                                                                                           React.createElement(Text, { style: styles.sectionTitle }, 'Détails'),
                                                                                                                           React.createElement(View, { style: styles.dateRow },
                                                                                                                                                           React.createElement(Text, { style: styles.dateLabel }, "Date d'émission"),
                                                                                                                                                           React.createElement(Text, { style: styles.dateValue }, formatDate(document.issue_date))
                                                                                                                                                         ),
                                                                                                                           document.due_date && React.createElement(View, { style: styles.dateRow },
                                                                                                                                                                                React.createElement(Text, { style: styles.dateLabel }, "Échéance"),
                                                                                                                                                                                React.createElement(Text, { style: styles.dateValue }, formatDate(document.due_date))
                                                                                                                                                                              ),
                                                                                                                           document.validity_date && React.createElement(View, { style: styles.dateRow },
                                                                                                                                                                                     React.createElement(Text, { style: styles.dateLabel }, "Valable jusqu'au"),
                                                                                                                                                                                     React.createElement(Text, { style: styles.dateValue }, formatDate(document.validity_date))
                                                                                                                                                                                   ),
                                                                                                                           document.payment_terms && React.createElement(View, { style: styles.dateRow },
                                                                                                                                                                                     React.createElement(Text, { style: styles.dateLabel }, "Conditions"),
                                                                                                                                                                                     React.createElement(Text, { style: styles.dateValue }, document.payment_terms)
                                                                                                                                                                                   )
                                                                                                                         )
                                                                                           ),

                                                                 // Table header
                                                                 React.createElement(View, { style: styles.tableHeader },
                                                                                             React.createElement(Text, { style: [styles.tableHeaderText, styles.colDescription] }, 'Description'),
                                                                                             React.createElement(Text, { style: [styles.tableHeaderText, styles.colQty] }, 'Qté'),
                                                                                             React.createElement(Text, { style: [styles.tableHeaderText, styles.colUnit] }, 'Unité'),
                                                                                             React.createElement(Text, { style: [styles.tableHeaderText, styles.colPrice] }, 'P.U. HT'),
                                                                                             React.createElement(Text, { style: [styles.tableHeaderText, styles.colTva] }, 'TVA'),
                                                                                             React.createElement(Text, { style: [styles.tableHeaderText, styles.colTotal] }, 'Total HT')
                                                                                           ),

                                                                 // Table rows
                                                                 ...lines.map((line, i) =>
                                                                           React.createElement(View, { key: line.id, style: [styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}] },
                                                                                                         React.createElement(Text, { style: styles.colDescription }, line.description),
                                                                                                         React.createElement(Text, { style: styles.colQty }, String(line.quantity)),
                                                                                                         React.createElement(Text, { style: styles.colUnit }, line.unit),
                                                                                                         React.createElement(Text, { style: styles.colPrice }, formatCurrency(line.unit_price)),
                                                                                                         React.createElement(Text, { style: styles.colTva }, `${line.tva_rate}%`),
                                                                                                         React.createElement(Text, { style: styles.colTotal }, formatCurrency(line.total_ht))
                                                                                                       )
                                                                                    ),

                                                                 // Totals
                                                                 React.createElement(View, { style: styles.totalsSection },
                                                                                             React.createElement(View, { style: styles.totalRow },
                                                                                                                           React.createElement(Text, { style: styles.totalLabel }, 'Sous-total HT'),
                                                                                                                           React.createElement(Text, { style: styles.totalValue }, formatCurrency(document.subtotal))
                                                                                                                         ),
                                                                                             React.createElement(View, { style: styles.totalRow },
                                                                                                                           React.createElement(Text, { style: styles.totalLabel }, `TVA (${document.tva_rate}%)`),
                                                                                                                           React.createElement(Text, { style: styles.totalValue }, formatCurrency(document.tva_amount))
                                                                                                                         ),
                                                                                             React.createElement(View, { style: styles.totalFinal },
                                                                                                                           React.createElement(Text, { style: styles.totalFinalLabel }, 'Total TTC'),
                                                                                                                           React.createElement(Text, { style: styles.totalFinalValue }, formatCurrency(document.total))
                                                                                                                         )
                                                                                           ),

                                                                 // Notes
                                                                 document.notes && React.createElement(View, { style: styles.notesSection },
                                                                                                               React.createElement(Text, { style: { fontSize: 9, fontWeight: 'bold', marginBottom: 4 } }, 'Notes'),
                                                                                                               React.createElement(Text, { style: { fontSize: 9, color: '#78350f' } }, document.notes)
                                                                                                             ),

                                                                 // Signature
                                                                 document.signed_at && document.signature_image && React.createElement(View, { style: styles.signatureSection },
                                                                                                                                               React.createElement(Text, { style: styles.sectionTitle }, 'Signature électronique'),
                                                                                                                                               React.createElement(Text, { style: { fontSize: 8, color: '#6b7280' } }, `Signé le ${formatDate(document.signed_at)} depuis IP ${document.signature_ip || 'N/A'}`)
                                                                                                                                             ),

                                                                 // Footer
                                                                 React.createElement(View, { style: styles.footer },
                                                                                             React.createElement(Text, null, document.footer_text || `${companyName} - Document généré par FactureDoc AI`)
                                                                                           )
                                                               )
                                     )
}

export async function generatePDFBuffer(
    document: Document,
    profile: Profile
  ): Promise<Buffer> {
    const element = React.createElement(FactureDocPDF, { document, profile })
    const buffer = await renderToBuffer(element)
    return buffer
}
