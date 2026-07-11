import PublicHeader from '../components/layout/PublicHeader'
import PublicFooter from '../components/layout/PublicFooter'

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `When you create an account, we collect your name, email address, phone number, and password (stored as a secure hash, never in plain text). If you list a parking space as an Owner, we also collect the listing's address, coordinates, pricing, photos, and — if you submit them for verification — a KYC identity document and bank account details for payouts. If you book a space as a Driver, we collect your vehicle details and booking history.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use your information to operate the marketplace: creating and authenticating your account, processing bookings and payments, calculating and paying out Owner earnings, sending booking and account notifications, verifying Owner identity and bank details, and responding to support requests.`,
  },
  {
    title: '3. What We Share',
    body: `To complete a booking, a Driver's name and vehicle details are shared with the Owner of the space they booked, and the Owner's listing and contact details are shown to the Driver. We do not sell your personal information to third parties. Payment processing is handled by our payment gateway partner; Carparkin does not store your full card details.`,
  },
  {
    title: '4. KYC and Bank Details',
    body: `Owner identity documents and bank account details are submitted for the sole purpose of verifying eligibility to receive payouts and are reviewed by Carparkin's admin team. Bank account numbers are masked wherever displayed in the product outside of the review process.`,
  },
  {
    title: '5. Data Retention',
    body: `We retain account and booking data for as long as your account is active and as needed to comply with legal, tax, and accounting obligations. You may request account deletion through Support, subject to any records we're required to retain.`,
  },
  {
    title: '6. Cookies and Sessions',
    body: `Carparkin uses session tokens to keep you signed in. We do not use third-party advertising trackers.`,
  },
  {
    title: '7. Your Choices',
    body: `You can review and update your profile information at any time from Profile & Settings. You can control notification preferences from the same page.`,
  },
  {
    title: '8. Security',
    body: `We use industry-standard practices to protect your data, including password hashing and encrypted connections. No method of transmission or storage is 100% secure, and we encourage you to use a strong, unique password.`,
  },
  {
    title: '9. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. Material changes will be reflected by an updated "Last updated" date above.`,
  },
  {
    title: '10. Contact',
    body: `Questions about this Privacy Policy can be sent through the Support section of the app.`,
  },
]

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-surface">
      <PublicHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ink">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink/50">Last updated: January 2026</p>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="font-display text-lg font-semibold text-ink mb-2">{s.title}</h2>
              <p className="text-sm text-ink/60 leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
