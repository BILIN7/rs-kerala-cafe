'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { orderAPI } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import { useCartStore } from '@/lib/store/cartStore'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { CheckCircle2, Clock, MapPin, Package, ArrowRight, Home, Timer, Key } from 'lucide-react'

export default function OrderConfirmationPage() {
  const { id } = useParams()
  const { clearCart } = useCartStore()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    clearCart()
    if (id) {
      orderAPI.getById(id as string)
        .then(res => {
          const ord = res.data.order
          setOrder(ord)
          if (typeof window !== 'undefined' && ord) {
            localStorage.setItem('tasty_active_order', JSON.stringify({
              id: ord._id,
              orderNumber: ord.orderNumber,
              status: ord.status,
              total: ord.total,
              fulfillmentType: ord.fulfillmentType
            }))
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }
  }, [id, clearCart])

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

  if (!order) {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
          <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
          <p className="text-gray-500 mb-6">Could not retrieve order details.</p>
          <Link href="/menu" className="btn-primary">Browse Menu</Link>
        </div>
        <Footer />
      </>
    )
  }

  const isCol = order.fulfillmentType === 'collection'

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream py-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-green-200">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>
            <h1 className="font-display text-3xl font-bold text-dark mb-1">Order Placed Successfully! 🎉</h1>
            <p className="text-xs text-gray-600">
              Kitchen ticket dispatched to RS Kerala Cafe Manchester. Your meal is being prepared!
            </p>
          </div>

          <div className="card p-6 mb-6 shadow-md">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Order Reference</p>
                <p className="font-bold text-lg text-dark font-mono">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  {order.paymentMethod === 'cash' || order.paymentStatus === 'pending' ? 'Amount to Pay (Cash)' : 'Total Paid (Online)'}
                </p>
                <p className="font-bold text-xl text-primary-600">{formatPrice(order.total)}</p>
              </div>
            </div>

            {/* Payment Method Badge */}
            <div className={`mb-5 p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              order.paymentMethod === 'cash' || order.paymentStatus === 'pending'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-green-50 border-green-300 text-green-900'
            }`}>
              <div className="flex items-center gap-2">
                {order.paymentMethod === 'cash' || order.paymentStatus === 'pending' ? (
                  <>
                    <span className="text-base">💵</span>
                    <div>
                      <span className="font-bold block">Cash on Handover / Delivery</span>
                      <span className="text-[11px] text-amber-800">Please prepare exact cash of {formatPrice(order.total)} for the driver/counter</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-base">💳</span>
                    <div>
                      <span className="font-bold block">Paid Online ({order.paymentMethod?.toUpperCase() || 'Card'})</span>
                      <span className="text-[11px] text-green-800">Ref: {order.paymentReference || 'SIM-GBP-PAID'} • No money required on handover</span>
                    </div>
                  </>
                )}
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                order.paymentMethod === 'cash' || order.paymentStatus === 'pending'
                  ? 'bg-amber-200 text-amber-950'
                  : 'bg-green-200 text-green-950'
              }`}>
                {order.paymentMethod === 'cash' || order.paymentStatus === 'pending' ? 'Pay on Handover' : 'Paid ✓'}
              </span>
            </div>

            {/* 4-digit Handover Verification PIN Card (For BOTH Collection AND Delivery) */}
            <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-dark text-white p-5 rounded-2xl mb-6 shadow-md text-center">
              <span className="inline-block bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2">
                {isCol ? '🏃 Counter Collection Handover Code' : '🚚 Doorstep Delivery Handover Code'}
              </span>
              <p className="text-xs text-primary-100">
                {isCol
                  ? 'Show this 4-digit PIN to restaurant counter staff upon arrival'
                  : 'Give this 4-digit PIN to the delivery driver at your doorstep to confirm delivery'}
              </p>
              <div className="text-4xl font-mono font-black tracking-[0.25em] my-3 bg-white/15 py-2.5 px-6 rounded-xl inline-block border border-white/25 shadow-inner">
                {order.deliveryPin || order.collectionPin || order.handoverPin || '5391'}
              </div>
              <p className="text-[11px] text-primary-200">
                {isCol
                  ? '📍 Pickup at: RS Kerala Cafe, 303 Palatine Rd, Northenden, Manchester, M22 4HH'
                  : `📍 Delivering to: ${order.deliveryAddress?.line1 || ''}, ${order.deliveryAddress?.postcode || ''}`}
              </p>
            </div>

            {/* Estimated Cooking Time & Fulfillment Banner */}
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-6 bg-cream p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2.5">
                {order.fulfillmentType === 'delivery' ? (
                  <>
                    <Package className="w-5 h-5 text-primary-600 shrink-0" />
                    <div>
                      <span className="font-bold block text-dark">Home Delivery</span>
                      <span className="text-gray-500">
                        {order.deliveryAddress?.line1}, {order.deliveryAddress?.postcode}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5 text-primary-600 shrink-0" />
                    <div>
                      <span className="font-bold block text-dark">Counter Pickup</span>
                      <span className="text-gray-500">RS Kerala Cafe Northenden</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <Timer className="w-5 h-5 text-orange-600 shrink-0 animate-spin" />
                <div>
                  <span className="font-bold block text-dark">Cooking Time:</span>
                  <span className="text-orange-700 font-bold">
                    ~{order.estimatedCookingMinutes || 20} mins (Chef Cooking)
                  </span>
                </div>
              </div>
            </div>

            <h3 className="font-semibold text-xs text-dark uppercase tracking-wider mb-3">Order Items</h3>
            <div className="space-y-2 mb-5">
              {order.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-xs border-b pb-2">
                  <div>
                    <span className="font-medium text-dark">{item.name}</span>
                    <span className="text-primary-600 font-bold ml-1.5">× {item.quantity}</span>
                  </div>
                  <span className="font-mono font-semibold">{formatPrice(item.itemTotal)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs pt-1 border-t">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>{formatPrice(order.deliveryFee)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-dark pt-2 border-t">
                <span>Total Amount Paid</span>
                <span className="text-primary-600 font-mono text-base">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Action Navigation Buttons: Track Live vs Return to Main Page */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href={`/order/${order._id}/track`}
              className="btn-primary py-3.5 text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-center"
            >
              <Timer className="w-4 h-4" /> Live Order Tracking <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/"
              className="py-3.5 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-dark font-bold text-xs flex items-center justify-center gap-2 text-center transition-colors shadow-xs"
            >
              <Home className="w-4 h-4 text-gray-600" /> Return to Main Page
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
