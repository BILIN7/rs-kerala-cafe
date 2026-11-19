import Link from 'next/link'
import { ArrowRight, Clock, MapPin, Star, Truck } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import FeaturedItems from '@/components/menu/FeaturedItems'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <main>
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-dark via-dark-light to-dark min-h-[85vh] flex items-center overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 right-20 text-9xl">🍛</div>
            <div className="absolute bottom-20 right-40 text-7xl">🌶️</div>
            <div className="absolute top-40 left-10 text-6xl">✨</div>
            <div className="absolute bottom-40 left-20 text-8xl">🫕</div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-4 py-2 text-sm font-semibold mb-6">
                <span>🌴</span> Authentic Malabar & Kerala Cuisine in Manchester
              </div>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                RS Kerala <span className="text-amber-400">Café</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Authentic flavours crafted with traditional coastal recipes from God&apos;s Own Country.
                Thalassery Biriyani, crispy Ghee Roast Dosas, flaky Malabar Porottas, and aromatic curries delivered hot to your door in Manchester.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/menu" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
                  Order Now <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/menu"
                  className="btn-secondary flex items-center gap-2 text-lg px-8 py-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  View Menu
                </Link>
              </div>

              {/* Info pills */}
              <div className="flex flex-wrap gap-4 mt-10">
                {[
                  { icon: <Clock className="w-4 h-4" />, text: '5PM – 10PM Daily' },
                  { icon: <Truck className="w-4 h-4" />, text: 'Free delivery over £30' },
                  { icon: <MapPin className="w-4 h-4" />, text: 'Manchester & Surrounding Areas' },
                ].map(({ icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-2 text-sm text-gray-300 bg-white/10 rounded-full px-4 py-2"
                  >
                    <span className="text-primary-400">{icon}</span> {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* USP Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  emoji: '👨‍🍳',
                  title: 'Freshly Made',
                  desc: 'Every dish cooked fresh to order using traditional recipes and authentic spices.',
                },
                {
                  emoji: '🚚',
                  title: 'Fast Delivery',
                  desc: 'Hot, freshly prepared food at your doorstep within 45 minutes.',
                },
                {
                  emoji: '🌿',
                  title: 'Quality Ingredients',
                  desc: 'Premium halal meat, fresh vegetables, and aromatic spices sourced locally.',
                },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="text-center p-6">
                  <div className="text-5xl mb-4">{emoji}</div>
                  <h3 className="font-display font-bold text-xl text-dark mb-2">{title}</h3>
                  <p className="text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Items */}
        <section className="py-16 bg-cream-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-dark mb-3">
                Customer Favourites
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Our most loved dishes, crafted with passion and served with love
              </p>
            </div>
            <FeaturedItems />
            <div className="text-center mt-10">
              <Link href="/menu" className="btn-primary inline-flex items-center gap-2 px-8">
                View Full Menu <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Pre-order banner */}
        <section className="py-12 bg-primary-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
              🕐 Schedule Your Order in Advance
            </h2>
            <p className="text-primary-100 mb-6">
              Pre-order up to 3 days ahead and get your favourite meal ready exactly when you want it.
            </p>
            <Link
              href="/menu?preorder=true"
              className="bg-white text-primary-600 hover:bg-primary-50 font-bold px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
            >
              Schedule an Order <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
