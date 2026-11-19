'use client'
import { useEffect, useState } from 'react'
import { authAPI, orderAPI } from '@/lib/api'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatPrice, formatDate, ORDER_STATUSES, validateUKPostcode } from '@/lib/utils'
import { User, Package, LogOut, ArrowRight, Clock, MapPin, Plus, Trash2, Home, Briefcase, Navigation, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses'>('orders')

  // Add Address Form State
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [label, setLabel] = useState('Home')
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [city, setCity] = useState('Manchester')
  const [postcode, setPostcode] = useState('')
  const [gateCode, setGateCode] = useState('')
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>()
  const [isLocating, setIsLocating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const fetchUserData = () => {
    Promise.all([
      authAPI.me().catch(() => null),
      orderAPI.getMy().catch(() => null),
    ]).then(([userRes, ordersRes]) => {
      if (userRes && userRes.data) setUser(userRes.data.user)
      if (ordersRes && ordersRes.data) setOrders(ordersRes.data.orders || [])
      setLoading(false)
    })
  }

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (!token) {
      router.push('/login')
      return
    }
    fetchUserData()
  }, [router])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_info')
    }
    toast.success('Logged out')
    router.push('/login')
  }

  // Geolocation detector
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      return toast.error('Geolocation not supported by your browser')
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoordinates({ lat, lng })

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`)
          const data = await res.json()
          if (data && data.address) {
            setLine1([data.address.house_number, data.address.road].filter(Boolean).join(' ') || data.address.suburb || '')
            setCity(data.address.city || data.address.town || 'Manchester')
            if (data.address.postcode) setPostcode(data.address.postcode.toUpperCase())
            toast.success('Address populated from GPS!')
          }
        } catch (e) {
          toast.error('Location found, please check street details')
        } finally {
          setIsLocating(false)
        }
      },
      () => {
        setIsLocating(false)
        toast.error('Could not get GPS location')
      }
    )
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!line1.trim() || !postcode.trim()) {
      return toast.error('Please enter street address and postcode')
    }
    if (!validateUKPostcode(postcode)) {
      return toast.error('Please enter a valid UK postcode (e.g. M22 4HH)')
    }

    setIsSaving(true)
    try {
      await authAPI.addAddress({
        label,
        line1,
        line2,
        city,
        postcode: postcode.toUpperCase(),
        gateCode,
        coordinates,
      })
      toast.success('Permanent address added!')
      setShowAddAddress(false)
      setLine1('')
      setLine2('')
      setPostcode('')
      setGateCode('')
      fetchUserData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add address')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAddress = async (id: string) => {
    try {
      await authAPI.deleteAddress(id)
      toast.success('Address removed')
      fetchUserData()
    } catch (err) {
      toast.error('Could not delete address')
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header Profile Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-dark">{user?.name || 'Customer Profile'}</h1>
                <p className="text-xs text-gray-500">{user?.email} • {user?.phone || 'No phone added'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-semibold bg-red-50 border border-red-200 px-3.5 py-2 rounded-xl transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-6 border-b pb-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'orders' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:text-dark'
              }`}
            >
              <Package className="w-4 h-4" /> My Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'addresses' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:text-dark'
              }`}
            >
              <MapPin className="w-4 h-4" /> Saved Addresses ({user?.addresses?.length || 0})
            </button>
          </div>

          {/* Tab 1: Orders */}
          {activeTab === 'orders' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <h2 className="font-bold text-dark text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary-600" /> Order History
                </h2>
                <span className="text-xs text-gray-400">{orders.length} orders found</span>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm mb-4">You haven't placed any orders yet.</p>
                  <Link href="/menu" className="btn-primary text-xs py-2.5 px-5">Browse Menu</Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {orders.map((ord) => (
                    <div key={ord._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-dark">{ord.orderNumber}</span>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full capitalize">
                            {ord.fulfillmentType}
                          </span>
                          <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full capitalize font-semibold">
                            {ORDER_STATUSES[ord.status as keyof typeof ORDER_STATUSES]?.label || ord.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {ord.items?.map((it: any) => `${it.name} (${it.quantity})`).join(', ')}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDate(ord.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-bold text-dark text-sm">{formatPrice(ord.total)}</span>
                        <Link
                          href={`/order/${ord._id}/track`}
                          className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 bg-primary-50 px-3 py-1.5 rounded-lg"
                        >
                          Track <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Saved Permanent Addresses */}
          {activeTab === 'addresses' && (
            <div className="card p-6 space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="font-bold text-dark text-base">Permanent Delivery Addresses</h2>
                  <p className="text-xs text-gray-500">Save your home, office or partner's address for 1-click checkout</p>
                </div>
                <button
                  onClick={() => setShowAddAddress(!showAddAddress)}
                  className="btn-primary py-2 px-3.5 text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> {showAddAddress ? 'Cancel' : 'Add New Address'}
                </button>
              </div>

              {/* Add Address Form Modal / Inline */}
              {showAddAddress && (
                <form onSubmit={handleSaveAddress} className="p-5 bg-cream/70 rounded-2xl border border-primary-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-dark">Add New Permanent Address</h3>
                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      disabled={isLocating}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 bg-white border border-primary-300 px-3 py-1.5 rounded-lg hover:bg-primary-50"
                    >
                      <Navigation className="w-3 h-3" /> {isLocating ? 'Detecting...' : '📍 Auto-detect GPS'}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {(['Home', 'Work', 'Other'] as const).map((lbl) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setLabel(lbl)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold border ${
                          label === lbl ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Street Address *</label>
                    <input
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      placeholder="e.g. 10 Downham Road"
                      className="input text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Flat / Building / Floor (optional)</label>
                    <input
                      value={line2}
                      onChange={(e) => setLine2(e.target.value)}
                      placeholder="e.g. Flat 4B"
                      className="input text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="input text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Postcode *</label>
                      <input
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                        placeholder="M22 4HH"
                        className="input text-xs font-mono uppercase"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Gate / Buzzer Code (optional)</label>
                    <input
                      value={gateCode}
                      onChange={(e) => setGateCode(e.target.value)}
                      placeholder="e.g. #9812"
                      className="input text-xs font-mono"
                    />
                  </div>

                  {coordinates && (
                    <div className="rounded-xl overflow-hidden border">
                      <iframe
                        title="Map preview"
                        width="100%"
                        height="150"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lng - 0.005}%2C${coordinates.lat - 0.005}%2C${coordinates.lng + 0.005}%2C${coordinates.lat + 0.005}&layer=mapnik&marker=${coordinates.lat}%2C${coordinates.lng}`}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary w-full py-2.5 text-xs font-bold"
                  >
                    {isSaving ? 'Saving...' : 'Save Address'}
                  </button>
                </form>
              )}

              {/* Address List */}
              {user?.addresses && user.addresses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.addresses.map((addr: any) => (
                    <div
                      key={addr._id}
                      className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-dark px-2.5 py-1 rounded-md bg-gray-100">
                          {addr.label === 'Work' ? <Briefcase className="w-3.5 h-3.5 text-blue-600" /> : <Home className="w-3.5 h-3.5 text-primary-600" />}
                          {addr.label || 'Home'}
                        </span>
                        <button
                          onClick={() => handleDeleteAddress(addr._id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                          title="Delete address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark">{addr.line1}</p>
                        {addr.line2 && <p className="text-xs text-gray-500">{addr.line2}</p>}
                        <p className="text-xs text-gray-600 mt-1">{addr.city}, <strong className="text-dark">{addr.postcode}</strong></p>
                        {addr.gateCode && <p className="text-xs text-primary-700 font-mono mt-1">Gate / Buzzer: {addr.gateCode}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No permanent addresses saved yet. Click "Add New Address" above or check the box during checkout.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
