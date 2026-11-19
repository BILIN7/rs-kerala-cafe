import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import Link from 'next/link'
import Image from 'next/image'
import { ChefHat, Heart, Award, Sparkles, ArrowRight, ShieldCheck, Flame, Leaf } from 'lucide-react'

export const metadata = {
  title: 'About Us | RS Kerala Cafe - Authentic South Indian Kitchen Manchester',
  description: 'Learn about RS Kerala Cafe Manchester: authentic Malabar and Kerala home-style cooking prepared fresh to order in South Manchester.',
}

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <main className="min-h-screen bg-cream">
        {/* Hero Banner */}
        <section className="bg-dark text-white py-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 flex items-center justify-center text-9xl select-none pointer-events-none">
            🥘
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <span className="inline-flex items-center gap-1.5 bg-primary-600/20 text-primary-400 border border-primary-600/30 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Our Culinary Story
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Authentic Kerala Flavours, <br className="hidden sm:inline" />
              <span className="text-primary-400">Cooked Fresh to Order</span> in Manchester
            </h1>
            <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Inspired by the coastal kitchens and spice gardens of God&apos;s Own Country, RS Kerala Cafe brings the true taste of South India to Greater Manchester.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 rounded-3xl overflow-hidden shadow-xl border-4 border-white">
              <Image
                src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80"
                alt="Chef preparing authentic Dum Biriyani"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <span className="text-white text-sm font-semibold">
                  Fresh Malabar Kaima Biriyani slow-cooked dum style
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-3xl font-bold text-dark leading-tight">
                Never Pre-Cooked. <br />Always Made Fresh for You.
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                Unlike high-street takeaways that keep batches of curry sitting in warming trays for hours, <strong>RS Kerala Cafe operates on a strictly fresh-to-order kitchen model</strong>.
              </p>
              <p className="text-gray-600 leading-relaxed text-sm">
                From slow-roasting beef with sliced coconut and crushed black pepper to kneading layered dough for hot crispy porottas, our chefs start preparing your meal the moment your ticket enters our kitchen in Northenden.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-primary-600 shrink-0" />
                  <span className="text-xs font-bold text-dark">Traditional Clay & Iron Pots</span>
                </div>
                <div className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-green-600 shrink-0" />
                  <span className="text-xs font-bold text-dark">Cold-Pressed Coconut Oil</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-dark">100% Halal Certified Meats</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600 shrink-0" />
                  <span className="text-xs font-bold text-dark">5-Star Food Hygiene</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pillars / Values */}
        <section className="bg-white py-16 border-y border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="font-display text-3xl font-bold text-dark mb-3">Why Manchester Loves RS Kerala Cafe</h2>
              <p className="text-gray-500 text-sm">Our pledge to authenticity, freshness, and local community</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <ChefHat className="w-6 h-6 text-primary-600" />,
                  title: 'Culinary Master Chefs',
                  desc: 'Our culinary team trained in Kerala, perfecting secret spice mixes passed down through generations.',
                },
                {
                  icon: <Heart className="w-6 h-6 text-primary-600" />,
                  title: 'Whole, Natural Ingredients',
                  desc: 'Zero artificial colourings or preservatives. Only ground turmeric, roasted chilies, and fresh curry leaves.',
                },
                {
                  icon: <Award className="w-6 h-6 text-primary-600" />,
                  title: 'Secure Collection & Delivery',
                  desc: 'Direct courier delivery across South Manchester or easy collection with 4-digit verification code.',
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="p-6 rounded-2xl bg-cream border border-primary-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4">
                    {icon}
                  </div>
                  <h3 className="font-display font-bold text-lg text-dark mb-2">{title}</h3>
                  <p className="text-gray-600 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { num: '15,000+', label: 'Happy Customers in Manchester' },
              { num: '4.9 ★', label: 'Average Customer Rating' },
              { num: '45 Mins', label: 'Average Delivery Time' },
              { num: '100%', label: 'Cooked Fresh to Order' },
            ].map(({ num, label }) => (
              <div key={label} className="card p-6">
                <p className="font-display text-3xl font-bold text-primary-600 mb-1">{num}</p>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <Link
              href="/menu"
              className="btn-primary inline-flex items-center gap-2 py-4 px-8 text-base shadow-lg hover:shadow-xl"
            >
              Order Online Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
