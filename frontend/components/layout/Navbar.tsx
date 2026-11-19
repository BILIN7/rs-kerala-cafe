'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Menu, X, ChefHat, User, Timer, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/lib/store/cartStore'
import { orderAPI } from '@/lib/api'
import Logo from '@/components/ui/Logo'

export default function Navbar() {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount, openCart } = useCartStore()
  const [activeOrder, setActiveOrder] = useState<any>(null)
  const logoClicksRef = useRef<number[]>([])

  const handleLogoClick = (e: React.MouseEvent) => {
    const now = Date.now()
    // Keep clicks occurring within the last 1500ms
    logoClicksRef.current = logoClicksRef.current.filter(t => now - t < 1500)
    logoClicksRef.current.push(now)

    if (logoClicksRef.current.length >= 3) {
      e.preventDefault()
      logoClicksRef.current = []
      router.push('/admin')
    }
  }

  useEffect(() => {
    let isMounted = true

    const checkActiveOrder = async () => {
      if (typeof window === 'undefined') return
      const stored = localStorage.getItem('tasty_active_order')
      if (!stored) {
        if (isMounted) setActiveOrder(null)
        return
      }

      try {
        const parsed = JSON.parse(stored)
        // If order was already delivered, collected, or cancelled, remove immediately
        if (!parsed || parsed.status === 'delivered' || parsed.status === 'collected' || parsed.status === 'cancelled') {
          localStorage.removeItem('tasty_active_order')
          if (isMounted) setActiveOrder(null)
          return
        }

        const orderId = parsed.id || parsed._id
        if (!orderId) {
          localStorage.removeItem('tasty_active_order')
          if (isMounted) setActiveOrder(null)
          return
        }

        // Verify with server that this order genuinely exists and is still in progress
        try {
          const res = await orderAPI.track(orderId)
          const liveOrder = res.data?.order
          if (!liveOrder || liveOrder.status === 'delivered' || liveOrder.status === 'collected' || liveOrder.status === 'cancelled') {
            localStorage.removeItem('tasty_active_order')
            if (isMounted) setActiveOrder(null)
            return
          }

          if (isMounted) {
            setActiveOrder({
              ...parsed,
              ...liveOrder,
              id: liveOrder._id,
            })
          }
        } catch (err: any) {
          // If order does not exist on server (e.g. 404 or backend restarted), clear it!
          if (err.response?.status === 404) {
            localStorage.removeItem('tasty_active_order')
            if (isMounted) setActiveOrder(null)
          }
        }
      } catch (e) {
        localStorage.removeItem('tasty_active_order')
        if (isMounted) setActiveOrder(null)
      }
    }

    checkActiveOrder()
    window.addEventListener('storage', checkActiveOrder)
    const interval = setInterval(checkActiveOrder, 5000)
    return () => {
      isMounted = false
      window.removeEventListener('storage', checkActiveOrder)
      clearInterval(interval)
    }
  }, [])

  const isOrderActive =
    activeOrder &&
    activeOrder.status !== 'delivered' &&
    activeOrder.status !== 'collected' &&
    activeOrder.status !== 'cancelled'

  return (
    <>
      {/* 🔔 Active Order Live Tracking Banner (Only shown if a live order is genuinely in progress) */}
      {isOrderActive && (
        <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-dark text-white text-xs px-4 py-2 shadow-sm animate-fade-in">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping shrink-0" />
              <span>
                Your Order <strong>#{activeOrder.orderNumber || activeOrder.id}</strong>{' '}
                {activeOrder.status === 'out_for_delivery'
                  ? 'is out for delivery with our courier!'
                  : activeOrder.status === 'ready'
                  ? 'is packed and ready at the counter!'
                  : 'is being freshly prepared in the kitchen!'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/order/${activeOrder.id || activeOrder._id}/track`}
                className="bg-white text-dark hover:bg-yellow-300 font-bold px-3 py-1 rounded-full text-[11px] transition-colors flex items-center gap-1 shrink-0 shadow-sm"
              >
                <Timer className="w-3.5 h-3.5 text-primary-600" />
                <span>Track Live Order</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('tasty_active_order')
                  setActiveOrder(null)
                }}
                className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                title="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Triple click allows secret admin entry */}
            <Link
              href="/"
              onClick={handleLogoClick}
              className="flex items-center group cursor-pointer select-none"
              title="RS Kerala Cafe - Click 3 times for Admin"
            >
              <Logo size="md" variant="light" />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium text-dark-muted hover:text-primary-600 transition-colors">Home</Link>
              <Link href="/menu" className="text-sm font-medium text-dark-muted hover:text-primary-600 transition-colors">Menu</Link>
              <Link href="/about" className="text-sm font-medium text-dark-muted hover:text-primary-600 transition-colors">About</Link>
              <Link href="/contact" className="text-sm font-medium text-dark-muted hover:text-primary-600 transition-colors">Contact</Link>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {activeOrder && (
                <Link
                  href={`/order/${activeOrder.id || activeOrder._id}/track`}
                  className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-xl hover:bg-primary-100 transition-colors"
                >
                  <Timer className="w-3.5 h-3.5 text-primary-600" />
                  <span>Live Tracker</span>
                </Link>
              )}

              <Link href="/account" className="p-2 rounded-xl hover:bg-gray-50 transition-colors hidden md:flex">
                <User className="w-5 h-5 text-dark-muted" />
              </Link>

              {/* Cart button */}
              <button
                onClick={openCart}
                className="relative flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-dark text-white text-xs rounded-full flex items-center justify-center font-bold animate-bounce-subtle">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileOpen && (
            <div className="md:hidden border-t border-gray-100 py-4 space-y-2 animate-fade-in">
              {[
                ['/', 'Home'],
                ['/menu', 'Menu'],
                ['/about', 'About Us'],
                ['/contact', 'Contact'],
                ['/account', 'My Account'],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2 text-sm font-medium text-dark hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </>
  )
}
