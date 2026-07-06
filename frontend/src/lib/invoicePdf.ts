import { jsPDF } from 'jspdf'
import { accessCode } from './bookingHelpers'
import type { UserBooking } from '../api/user.api'

const PLAN_LABELS: Record<string, string> = { day: 'Daily', week: 'Weekly', month: 'Monthly' }

function fmtCurrency(n: number) { return `Rs. ${Number(n).toLocaleString('en-IN')}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

export function downloadInvoicePdf(booking: UserBooking, customerName: string) {
  const doc = new jsPDF()
  const marginX = 20
  let y = 22

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Carparkin', marginX, y)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Booking Receipt', marginX, y + 6)

  doc.setFontSize(10)
  doc.text(`Receipt #: ${booking.id}`, 190, y, { align: 'right' })
  doc.text(`Date: ${fmtDate(booking.booking_start_date)}`, 190, y + 6, { align: 'right' })

  y += 18
  doc.setDrawColor(220)
  doc.line(marginX, y, 190, y)
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Billed To', marginX, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(customerName, marginX, y)

  y += 14
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Booking Details', marginX, y)
  y += 8

  const rows: [string, string][] = [
    ['Parking Location', booking.listing_title ?? '—'],
    ['Address', booking.listing_address ?? '—'],
    ['Plan', PLAN_LABELS[booking.duration_type] ?? booking.duration_type],
    ['Period', `${fmtDate(booking.booking_start_date)} - ${fmtDate(booking.booking_end_date)} (${booking.duration_days} day${booking.duration_days === 1 ? '' : 's'})`],
    ['Access Code', accessCode(booking.id)],
  ]
  if (booking.registration_number) {
    rows.push(['Vehicle', `${booking.make ?? ''} ${booking.model ?? ''} · ${booking.registration_number}`.trim()])
  }
  rows.push(['Payment Status', booking.payment_status])
  rows.push(['Booking Status', booking.status])

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  for (const [label, value] of rows) {
    doc.setTextColor(120)
    doc.text(label, marginX, y)
    doc.setTextColor(20)
    const lines = doc.splitTextToSize(value, 110)
    doc.text(lines, 190, y, { align: 'right' })
    y += 7 * lines.length
  }

  y += 6
  doc.setDrawColor(220)
  doc.line(marginX, y, 190, y)
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(20)
  doc.text(booking.payment_status === 'completed' ? 'Total Paid' : 'Total Due', marginX, y)
  doc.text(fmtCurrency(booking.total_price), 190, y, { align: 'right' })

  y += 20
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text('This is a system-generated receipt from Carparkin.', marginX, y)

  doc.save(`carparkin-receipt-${booking.id}.pdf`)
}
