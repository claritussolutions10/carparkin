import type { SVGProps } from 'react'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function PublicFooter() {
  return (
    <footer className="bg-white border-t border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2">
            <MapPin className="text-green" size={22} fill="currentColor" strokeWidth={1.5} />
            <span className="font-display font-semibold text-navy">Carparkin.in</span>
          </div>
          <p className="mt-3 text-sm text-ink/50 max-w-xs">
            Making city living easier, one parking spot at a time. Secure, affordable, and flexible monthly parking.
          </p>
        </div>

        <div>
          <h4 className="font-display font-semibold text-sm text-ink mb-3">Platform</h4>
          <ul className="space-y-2">
            <li><Link to="/search" className="text-sm text-ink/50 hover:text-green transition-colors">Find Parking</Link></li>
            <li><Link to="/signup" className="text-sm text-ink/50 hover:text-green transition-colors">List Your Space</Link></li>
            <li><span className="text-sm text-ink/50">Pricing</span></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold text-sm text-ink mb-3">Company</h4>
          <ul className="space-y-2">
            <li><Link to="/about" className="text-sm text-ink/50 hover:text-green transition-colors">About Us</Link></li>
            <li><span className="text-sm text-ink/50">Careers</span></li>
            <li><span className="text-sm text-ink/50">Blog</span></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold text-sm text-ink mb-3">Support</h4>
          <ul className="space-y-2">
            <li><span className="text-sm text-ink/50">Help Center</span></li>
            <li><Link to="/terms" className="text-sm text-ink/50 hover:text-green transition-colors">Terms of Service</Link></li>
            <li><Link to="/privacy" className="text-sm text-ink/50 hover:text-green transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink/40">© 2026 Carparkin.in. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="Twitter" className="text-ink/40 hover:text-green transition-colors">
              <XIcon width={16} height={16} />
            </a>
            <a href="#" aria-label="Instagram" className="text-ink/40 hover:text-green transition-colors">
              <InstagramIcon width={16} height={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
