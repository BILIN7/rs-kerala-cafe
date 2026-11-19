import Link from 'next/link'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import Logo from '@/components/ui/Logo'

export default function Footer() {
  return (
    <footer className="bg-dark text-white mt-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <Logo size="md" variant="dark" />
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Authentic Malabar and Kerala culinary heritage crafted with fragrant spices and tradition, delivered piping hot to your door in Manchester.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-amber-400 text-sm">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {[
                ['/', 'Home'],
                ['/menu', 'Order Online'],
                ['/account', 'My Orders'],
                ['/about', 'About Us'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-amber-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold mb-4 text-amber-400 text-sm">Info & Policy</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/allergens" className="hover:text-amber-400 transition-colors">Allergen Info</Link></li>
              <li><Link href="/privacy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-amber-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/cookies" className="hover:text-amber-400 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-amber-400 text-sm">Contact Us</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <span>303 Palatine Rd, Northenden, Manchester, M22 4HH</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <a href="tel:+441619987654" className="hover:text-amber-400 transition-colors">0161 998 7654</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <a href="mailto:orders@rskeralacafe.co.uk" className="hover:text-amber-400 transition-colors">orders@rskeralacafe.co.uk</a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <span>Mon–Sun: 12:00 PM – 10:30 PM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} RS Kerala Cafe Ltd. All rights reserved.</p>
          <p>🇬🇧 Registered in England & Wales • Manchester, UK</p>
        </div>
      </div>
    </footer>
  )
}
