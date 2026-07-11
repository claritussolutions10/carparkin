import PublicHeader from '../components/layout/PublicHeader'
import PublicFooter from '../components/layout/PublicFooter'

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By creating an account, listing a parking space, or booking a parking space through Carparkin.in ("Carparkin", "we", "us"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.`,
  },
  {
    title: '2. What Carparkin Is',
    body: `Carparkin is a marketplace that connects vehicle owners ("Drivers") with parking space owners ("Owners") for the booking of parking spaces on a daily, weekly, or monthly basis. Carparkin is not a party to the parking arrangement itself — the contract for use of a parking space is between the Driver and the Owner. Carparkin facilitates discovery, booking, and payment, and charges a platform commission on completed bookings.`,
  },
  {
    title: '3. Account Registration',
    body: `You must provide accurate, current information when creating an account and keep your login credentials confidential. You are responsible for all activity under your account. Accounts may be suspended for violations of these terms, fraudulent activity, or at Carparkin's reasonable discretion.`,
  },
  {
    title: '4. Listings and Owner Responsibilities',
    body: `Owners are responsible for the accuracy of their listings (location, pricing, availability, amenities, and photos) and for the safety and legality of the space offered. Owners must hold any rights, permissions, or approvals required to offer the space for parking. Carparkin may require identity (KYC) and bank account verification before an Owner can receive payouts, and may review listings before they go live.`,
  },
  {
    title: '5. Bookings and Payments',
    body: `When a Driver books a space, payment is collected upfront through the platform. Carparkin deducts a commission (shown in your booking summary) before remitting the remaining amount to the Owner. Cancellation and refund eligibility depend on the specific listing's policy and how far in advance the booking is cancelled, as shown at the time of booking.`,
  },
  {
    title: '6. Reviews',
    body: `Drivers who complete a booking may leave a public review and rating. Reviews must reflect a genuine experience. Carparkin may remove reviews that are abusive, fraudulent, or that violate these terms, and Owners may post one public reply per review.`,
  },
  {
    title: '7. Prohibited Conduct',
    body: `You may not use Carparkin to list or book a space for any unlawful purpose, misrepresent your identity or a listing, circumvent platform fees by arranging payment outside the platform, or interfere with the security or operation of the service.`,
  },
  {
    title: '8. Limitation of Liability',
    body: `Carparkin provides the platform on an "as is" basis and does not guarantee the availability, condition, or safety of any parking space. To the maximum extent permitted by law, Carparkin is not liable for damage to vehicles, loss of property, or disputes arising directly between Drivers and Owners.`,
  },
  {
    title: '9. Changes to These Terms',
    body: `We may update these Terms from time to time. Continued use of Carparkin after a change is posted constitutes acceptance of the revised Terms.`,
  },
  {
    title: '10. Contact',
    body: `Questions about these Terms can be sent through the Support section of the app, or to the contact details listed on our About page.`,
  },
]

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-surface">
      <PublicHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ink">Terms of Service</h1>
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
