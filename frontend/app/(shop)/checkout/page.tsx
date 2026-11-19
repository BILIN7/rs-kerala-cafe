'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useCartStore } from '@/lib/store/cartStore'
import { formatPrice, validateUKPostcode } from '@/lib/utils'
import { orderAPI, couponAPI, authAPI, paymentAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import StripePayment from '@/components/checkout/StripePayment'
import AddressSelector, { AddressData } from '@/components/checkout/AddressSelector'
import {
  ArrowRight,
  Tag,
  Truck,
  Store,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Banknote,
  CreditCard,
  Clock
} from 'lucide-react'
import Link from 'next/link'

const checkoutSchema = z.object({
  name: z.string().min(2, 'Full Name is mandatory (min 2 characters)'),
  email: z.string().email('Valid email address is required for your receipt & tracking link'),
  phone: z
    .string()
    .min(1, 'Phone number is mandatory for all orders & collection')
    .refine(
      (val) => {
        const clean = (val || '').replace(/[\s\-\(\)\.]/g, '')
        return /^(?:(?:\+44|0044|0)[123789]\d{8,9}|\d{10,12})$/.test(clean)
      },
      {
        message: 'Valid UK contact phone number is required (e.g. 07700 900123 or 0161 998 7654)'
      }
    ),
  specialInstructions: z.string().optional(),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const router = useRouter()
  const {
    items,
    subtotal,
    deliveryFee,
    discount,
    total,
    fulfillmentType,
    setFulfillmentType,
    couponCode,
    setCoupon,
    removeCoupon,
    clearCart,
  } = useCartStore()

  const [step, setStep] = useState<'details' | 'payment'>('details')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'cash'>('stripe')
  const [couponInput, setCouponInput] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isCashPlacing, setIsCashPlacing] = useState(false)

  // Delivery Address State from AddressSelector
  const [deliveryAddress, setDeliveryAddress] = useState<AddressData>({
    line1: '',
    line2: '',
    city: 'Manchester',
    postcode: '',
    gateCode: '',
    deliveryPreference: '',
    driverNotes: '',
    label: 'Home',
    saveAsPermanent: false,
  })

  // Load user profile if logged in
  useEffect(() => {
    authAPI.me()
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: 'Marcus Rashford',
      email: 'marcus@mufc.co.uk',
      phone: '07700900123',
    }
  })

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      if (user.name) setValue('name', user.name)
      if (user.email) setValue('email', user.email)
      if (user.phone) setValue('phone', user.phone)
    }
  }, [user, setValue])

  const applyCoupon = async () => {
    if (!couponInput) return
    setApplyingCoupon(true)
    try {
      const res = await couponAPI.validate(couponInput, subtotal)
      setCoupon(res.data.coupon.code, res.data.discount)
      toast.success(`Coupon applied! You save ${formatPrice(res.data.discount)}`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon code')
    } finally {
      setApplyingCoupon(false)
    }
  }

  // Pre-fill demo data button
  const prefillDemoData = () => {
    setValue('name', 'Marcus Rashford')
    setValue('email', 'marcus@mufc.co.uk')
    setValue('phone', '07700900123')
    setValue('specialInstructions', 'Please make extra spicy and deliver to front desk')
    setDeliveryAddress({
      line1: 'Sir Matt Busby Way',
      line2: 'Old Trafford',
      city: 'Manchester',
      postcode: 'M16 0RA',
      gateCode: 'Gate 4',
      deliveryPreference: 'Leave with reception',
      driverNotes: 'Ring buzzer on arrival',
      label: 'Office',
      saveAsPermanent: true,
      coordinates: { lat: 53.46306, lng: -2.29139 }
    })
    toast.success('Pre-filled sample Manchester delivery address!')
  }

  const onSubmit = async (data: CheckoutForm) => {
    if (items.length === 0) return toast.error('Your cart is empty')

    if (fulfillmentType === 'delivery') {
      if (!deliveryAddress.line1.trim()) {
        return toast.error('Please enter your street address')
      }
      if (!deliveryAddress.postcode.trim()) {
        return toast.error('Please enter a UK postcode')
      }
      if (!validateUKPostcode(deliveryAddress.postcode)) {
        return toast.error('Please enter a valid UK postcode (e.g. M22 4HH)')
      }

      if (deliveryAddress.saveAsPermanent) {
        try {
          if (user) {
            await authAPI.addAddress({
              label: deliveryAddress.label || 'Home',
              line1: deliveryAddress.line1,
              line2: deliveryAddress.line2,
              city: deliveryAddress.city,
              postcode: deliveryAddress.postcode,
              gateCode: deliveryAddress.gateCode,
              coordinates: deliveryAddress.coordinates,
            })
            toast.success('Address saved permanently to your account!')
          } else if (typeof window !== 'undefined') {
            const existingRaw = localStorage.getItem('food_saved_addresses')
            const existing = existingRaw ? JSON.parse(existingRaw) : []
            existing.push({
              id: Date.now().toString(),
              ...deliveryAddress,
            })
            localStorage.setItem('food_saved_addresses', JSON.stringify(existing))
          }
        } catch (e) {
          console.warn('Address save non-fatal error:', e)
        }
      }
    }

    try {
      const orderData = {
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          price: i.price,
          image: i.image,
          quantity: i.quantity,
          selectedOptions: i.selectedOptions,
        })),
        fulfillmentType,
        deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress : undefined,
        couponCode: couponCode || undefined,
        specialInstructions: [data.specialInstructions, deliveryAddress.driverNotes].filter(Boolean).join(' | '),
        guestName: data.name,
        guestEmail: data.email,
        guestPhone: data.phone,
      }

      const res = await orderAPI.create(orderData)
      const newOrderId = res.data.order._id
      setOrderId(newOrderId)
      setStep('payment')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order')
    }
  }

  // Handle Cash / Pay on Arrival Order completion
  const handleCashOrderComplete = async () => {
    if (!orderId) return
    setIsCashPlacing(true)
    try {
      await paymentAPI.simulate(orderId, 'cash')
      clearCart()
      toast.success('🎉 Order confirmed! Pay on delivery/collection.')
      router.push(`/order/${orderId}/confirmation`)
    } catch (err) {
      toast.error('Failed to complete cash order')
    } finally {
      setIsCashPlacing(false)
    }
  }

  // Handle successful simulated card payment
  const handlePaymentSuccess = () => {
    clearCart()
    if (orderId) {
      router.push(`/order/${orderId}/confirmation`)
    }
  }

  if (items.length === 0 && step === 'details') {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center p-6">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="font-display text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6 text-sm">Add some delicious dishes from our menu before checking out.</p>
            <Link href="/menu" className="btn-primary inline-block">
              Browse Menu
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="font-display text-3xl font-bold text-dark">RS Kerala Cafe Checkout</h1>
              <p className="text-xs text-gray-500 mt-0.5">303 Palatine Rd, Northenden, Manchester • UK Fast Dispatch</p>
            </div>

            {step === 'details' && (
              <button
                type="button"
                onClick={prefillDemoData}
                className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-amber-700" />
                <span>Fill Sample Demo Data</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Checkout Details & Form */}
            <div className="lg:col-span-2 space-y-6">
              {step === 'details' ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Fulfillment Type Toggle */}
                  <div className="card p-6">
                    <h2 className="font-semibold text-lg mb-4">Delivery or Collection?</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        {
                          type: 'delivery' as const,
                          icon: <Truck className="w-5 h-5" />,
                          label: 'Delivery',
                          sub: '~45 mins · Free over £35',
                        },
                        {
                          type: 'collection' as const,
                          icon: <Store className="w-5 h-5" />,
                          label: 'Collection',
                          sub: '~20 mins · 4-digit PIN verification',
                        },
                      ].map(({ type, icon, label, sub }) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFulfillmentType(type)}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 text-center transition-all ${
                            fulfillmentType === type
                              ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                              : 'border-gray-200 hover:border-primary-200 bg-white'
                          }`}
                        >
                          {icon}
                          <span className="font-semibold">{label}</span>
                          <span className="text-xs text-gray-500">{sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checkout Mode: Guest vs Registered Customer */}
                  <div className="card p-5 bg-gradient-to-r from-slate-900 to-slate-950 text-white border-slate-800">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-400" />
                          <h3 className="font-bold text-sm text-white">
                            {user ? `Logged In as ${user.name}` : 'Guest Checkout Active'}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {user
                            ? 'Your saved Manchester addresses and contact details are loaded.'
                            : 'Order quickly as a guest without creating a password.'}
                        </p>
                      </div>

                      {!user ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setValue('name', 'Sarah Jenkins')
                              setValue('email', 'sarah.j@example.co.uk')
                              setValue('phone', '07700 900123')
                              toast.success('Pre-filled as Demo Customer (Sarah)!')
                            }}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl font-bold transition-colors"
                          >
                            👤 Quick Demo Profile
                          </button>
                          <Link
                            href="/login?redirect=/checkout"
                            className="text-xs text-primary-400 hover:text-primary-300 font-semibold underline px-2 py-1"
                          >
                            Sign In
                          </Link>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-green-400 bg-green-950/60 border border-green-800/80 px-2.5 py-1 rounded-lg">
                          ✓ Verified Customer
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Contact Details */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-lg">Contact Details</h2>
                      <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        * Phone Number Mandatory
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                        <input {...register('name')} className="input text-sm" placeholder="John Smith" />
                        {errors.name && (
                          <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address *</label>
                        <input
                          {...register('email')}
                          type="email"
                          className="input text-sm"
                          placeholder="john@example.co.uk"
                        />
                        {errors.email && (
                          <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-dark mb-1 flex items-center justify-between">
                          <span>UK Contact Phone Number * <span className="text-red-600">(Must for Delivery & Collection)</span></span>
                          <span className="text-[11px] font-normal text-gray-400">UK mobile or landline</span>
                        </label>
                        <input
                          {...register('phone')}
                          type="tel"
                          className="input text-sm font-mono"
                          placeholder="07700 900123"
                        />
                        {errors.phone ? (
                          <p className="text-red-500 text-xs mt-1 font-semibold">{errors.phone.message}</p>
                        ) : (
                          <p className="text-[11px] text-gray-500 mt-1">
                            ⚠️ Mandatory: Kitchen & delivery courier will contact you on this number for live order verification and 4-digit PIN handover.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address Section (Permanent / New / Map / Manual / Notes) */}
                  {fulfillmentType === 'delivery' && (
                    <div className="card p-6">
                      <AddressSelector
                        user={user}
                        onAddressSelect={(addr) => setDeliveryAddress(addr)}
                        initialAddress={deliveryAddress}
                      />
                    </div>
                  )}

                  {/* General Order Instructions */}
                  <div className="card p-6">
                    <h2 className="font-semibold text-lg mb-2">Order Notes & Dietary Requests</h2>
                    <p className="text-xs text-gray-500 mb-3">Optional allergen warnings, spice level adjustments or kitchen notes.</p>
                    <textarea
                      {...register('specialInstructions')}
                      className="input resize-none text-sm"
                      rows={2}
                      placeholder="e.g. Please make curries extra spicy, no peanuts, cutlery needed..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full text-base py-4 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Validating Order...' : 'Proceed to Payment →'}
                  </button>
                </form>
              ) : (
                /* Payment Step */
                <div className="card p-6 space-y-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h2 className="font-semibold text-lg">Payment & Dispatch</h2>
                      <p className="text-xs text-gray-500">Choose simulation payment or pay-on-arrival to notify the kitchen</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep('details')}
                      className="text-xs text-primary-600 hover:underline font-semibold"
                    >
                      ← Edit Details
                    </button>
                  </div>

                  {/* Delivery summary pill */}
                  {fulfillmentType === 'delivery' && deliveryAddress.line1 && (
                    <div className="bg-cream p-4 rounded-xl border border-primary-100 text-xs text-dark">
                      <p className="font-bold mb-1 flex items-center gap-1.5 text-primary-700">
                        <Truck className="w-4 h-4" /> Delivering to:
                      </p>
                      <p className="font-semibold">{deliveryAddress.line1} {deliveryAddress.line2 ? `, ${deliveryAddress.line2}` : ''}</p>
                      <p className="text-gray-600">{deliveryAddress.city}, {deliveryAddress.postcode}</p>
                      {deliveryAddress.gateCode && <p className="text-gray-500 mt-1">Gate / Buzzer: {deliveryAddress.gateCode}</p>}
                      {deliveryAddress.deliveryPreference && (
                        <p className="text-primary-800 font-medium mt-1">Preference: {deliveryAddress.deliveryPreference}</p>
                      )}
                    </div>
                  )}

                  {/* Payment Method Tabs */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('stripe')}
                      className={`p-3.5 rounded-xl font-bold text-xs border-2 transition-all flex items-center justify-center gap-2 ${
                        paymentMethod === 'stripe'
                          ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                          : 'border-gray-200 hover:border-primary-200 bg-white text-gray-700'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-primary-600" />
                      <span>Card / Simulation Mode</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-3.5 rounded-xl font-bold text-xs border-2 transition-all flex items-center justify-center gap-2 ${
                        paymentMethod === 'cash'
                          ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                          : 'border-gray-200 hover:border-primary-200 bg-white text-gray-700'
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-green-600" />
                      <span>Cash / Pay on Handover</span>
                    </button>
                  </div>

                  {/* Option 1: Card / Simulation Mode */}
                  {orderId && paymentMethod === 'stripe' && (
                    <StripePayment
                      orderId={orderId}
                      amount={total}
                      onSuccess={handlePaymentSuccess}
                    />
                  )}

                  {/* Option 2: Cash / Pay on Arrival */}
                  {orderId && paymentMethod === 'cash' && (
                    <div className="p-5 rounded-2xl bg-green-50 border-2 border-green-300 text-green-950 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white">
                          <Banknote className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">Pay on Handover (Cash)</h3>
                          <p className="text-xs text-green-800">
                            Pay exact cash of <strong>{formatPrice(total)}</strong> to the delivery driver or counter staff upon collection.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isCashPlacing}
                        onClick={handleCashOrderComplete}
                        className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                      >
                        {isCashPlacing ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Dispatching Order...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" /> Confirm Cash Order & Dispatch to Kitchen ({formatPrice(total)})
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Order Summary Sidebar */}
            <div className="space-y-4">
              <div className="card p-5 sticky top-24">
                <h2 className="font-semibold text-base mb-4 flex items-center justify-between border-b pb-3">
                  <span>Your Order ({items.length})</span>
                  <span className="text-xs text-primary-600 font-normal">RS Kerala Cafe UK</span>
                </h2>

                <div className="space-y-2.5 max-h-60 overflow-y-auto mb-4 divide-y divide-gray-50">
                  {items.map((item) => (
                    <div key={item.id} className="pt-2 first:pt-0 flex justify-between items-start text-sm">
                      <div className="pr-2">
                        <span className="font-medium text-dark">{item.name}</span>
                        <span className="text-gray-400 text-xs ml-1.5">× {item.quantity}</span>
                      </div>
                      <span className="font-semibold shrink-0">{formatPrice(item.itemTotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery {fulfillmentType === 'collection' ? '(Collection)' : subtotal >= 3500 ? '(Free over £35)' : ''}</span>
                    <span>{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Promo Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-dark text-base pt-3 border-t">
                    <span>Total Amount</span>
                    <span className="text-primary-600 font-display text-lg">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Estimated Cooking Time Notice */}
                <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2 shadow-xs">
                  <Clock className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-orange-950">Estimated Cooking Time: ~20 mins</span>
                    <span className="text-amber-800 text-[11px] leading-tight block mt-0.5">
                      {fulfillmentType === 'collection'
                        ? 'Freshly cooked to order in Manchester kitchen. 4-digit PIN verified counter collection.'
                        : 'Freshly cooked to order, then dispatched with our fast local courier.'}
                    </span>
                  </div>
                </div>

                {/* Promo Code Input */}
                {!couponCode ? (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Have a discount voucher?</label>
                    <div className="flex gap-2">
                      <input
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="input flex-1 text-xs py-2 uppercase font-mono"
                        placeholder="e.g. WELCOME10"
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={applyingCoupon}
                        className="btn-primary text-xs px-4 py-2"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                    <span className="flex items-center gap-1.5 text-green-700 text-xs font-bold">
                      <Tag className="w-3.5 h-3.5" /> {couponCode} (-{formatPrice(discount)})
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400 justify-center">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span>256-bit Encrypted SSL Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
