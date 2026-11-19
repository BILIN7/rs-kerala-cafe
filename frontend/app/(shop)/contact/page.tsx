'use client'
import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, ShieldCheck, Key } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !message) {
      return toast.error('Please complete all required fields')
    }

    setSending(true)
    setTimeout(() => {
      setSending(false)
      setSubmitted(true)
      toast.success('Thank you! Your message has been sent.')
      setName('')
      setEmail('')
      setPhone('')
      setMessage('')
    }, 800)
  }

  return (
    <>
      <Navbar />
      <CartDrawer />
      <main className="min-h-screen bg-cream py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-primary-600 bg-primary-100 px-3 py-1 rounded-full uppercase tracking-wider">
              Get in Touch
            </span>
            <h1 className="font-display text-4xl font-bold text-dark mt-3 mb-2">
              Contact & Collection Location
            </h1>
            <p className="text-gray-600 text-sm">
              Have questions about an order, catering for an event, or visiting us for pickup? We're here every evening.
            </p>
          </div>

          {/* Collection 4-digit Code Process Explainer */}
          <div className="bg-gradient-to-r from-dark via-dark-light to-dark text-white p-6 sm:p-8 rounded-3xl mb-12 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">How Order Collection Works</h2>
                <p className="text-xs text-gray-300">Fast, contactless and secure counter pickup</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {[
                { step: '1', title: 'Order Online', desc: 'Select Collection at checkout on web or mobile.' },
                { step: '2', title: 'Get 4-Digit PIN', desc: 'A secure 4-digit collection code is generated instantly.' },
                { step: '3', title: 'Visit Our Counter', desc: 'Head to 303 Palatine Rd, Northenden when your tracker shows Ready.' },
                { step: '4', title: 'Verify & Collect', desc: 'Show your 4-digit PIN to collect your piping-hot meal!' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="bg-white/10 p-4 rounded-2xl border border-white/10">
                  <span className="w-6 h-6 rounded-full bg-primary-500 text-white font-bold text-xs flex items-center justify-center mb-2">
                    {step}
                  </span>
                  <h3 className="font-bold text-sm mb-1 text-white">{title}</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left: Contact Info & Kitchen Details */}
            <div className="space-y-6">
              <div className="card p-6 space-y-5">
                <h2 className="font-display text-xl font-bold text-dark border-b pb-3">Kitchen Details</h2>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-dark">Kitchen & Collection Address</h3>
                    <p className="text-gray-600 text-sm mt-0.5 leading-relaxed">
                      303 Palatine Rd, Northenden,<br />
                      Wythenshawe, Manchester, M22 4HH<br />
                      United Kingdom
                    </p>
                    <span className="inline-block mt-1 text-[11px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                      Customer parking available outside
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 border-t pt-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-dark">Operating Hours</h3>
                    <p className="text-gray-600 text-sm mt-0.5">
                      <strong>Monday – Sunday:</strong> 5:00 PM – 10:00 PM<br />
                      <span className="text-xs text-gray-500">Open 7 days a week, including Bank Holidays</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 border-t pt-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-dark">Telephone</h3>
                    <a href="tel:+441610000000" className="text-primary-600 hover:underline font-semibold text-sm">
                      +44 161 000 0000
                    </a>
                    <p className="text-xs text-gray-400 mt-0.5">Order queries, catering & allergen inquiries</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 border-t pt-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-dark">Email Support</h3>
                    <a href="mailto:orders@tastyoven.co.uk" className="text-primary-600 hover:underline font-semibold text-sm">
                      orders@tastyoven.co.uk
                    </a>
                  </div>
                </div>
              </div>

              {/* Map Embed for Manchester Kitchen */}
              <div className="card overflow-hidden">
                <iframe
                  title="RS Kerala Cafe Manchester Location"
                  width="100%"
                  height="260"
                  frameBorder="0"
                  scrolling="no"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=-2.2600%2C53.4000%2C-2.2400%2C53.4150&layer=mapnik&marker=53.4070%2C-2.2515"
                />
                <div className="p-3 bg-white text-xs text-gray-600 flex items-center justify-between border-t">
                  <span>📍 303 Palatine Rd, Northenden, Manchester</span>
                  <a
                    href="https://maps.google.com/?q=303+Palatine+Rd+Northenden+Manchester+M22+4HH"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 font-bold hover:underline"
                  >
                    Open in Google Maps ↗
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Interactive Message & Feedback Form */}
            <div className="card p-6 sm:p-8">
              <h2 className="font-display text-2xl font-bold text-dark mb-2">Send Us a Message</h2>
              <p className="text-gray-500 text-xs mb-6">
                Have a special dietary question or feedback about your meal? Fill in the form below.
              </p>

              {submitted ? (
                <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
                  <h3 className="font-bold text-base">Message Sent Successfully!</h3>
                  <p className="text-xs text-green-700">
                    Thank you for contacting RS Kerala Cafe. Our team will get back to you within a few hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs text-green-800 font-bold underline mt-2 inline-block"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Your Name *</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="input text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="sarah@example.co.uk"
                        className="input text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number (optional)</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="07xxx xxxxxx"
                        className="input text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Your Message or Inquiry *</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      placeholder="Ask about ingredients, allergens, party catering, or order feedback..."
                      className="input text-sm resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="btn-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending Message...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
