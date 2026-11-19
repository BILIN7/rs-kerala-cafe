'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { io } from 'socket.io-client'
import { orderAPI } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import {
  ArrowLeft,
  Clock,
  MapPin,
  CheckCircle2,
  ChefHat,
  Bike,
  Package,
  ShoppingBag,
  BellRing,
  Key,
  ShieldCheck,
  AlertCircle,
  Timer,
  Zap,
  Sparkles,
  Phone
} from 'lucide-react'
import toast from 'react-hot-toast'

// Steps definition for Delivery
const DELIVERY_STEPS = [
  { key: 'confirmed', label: 'Order Confirmed', icon: '📝', desc: 'Kitchen received your ticket' },
  { key: 'preparing', label: 'Cooking in Kitchen', icon: '👨‍🍳', desc: 'Freshly cooked to order with authentic spices' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🛵', desc: 'Courier on the way to your address' },
  { key: 'delivered', label: 'Delivered', icon: '🎉', desc: 'Delivered to your doorstep. Enjoy!' },
]

// Steps definition for Collection
const COLLECTION_STEPS = [
  { key: 'confirmed', label: 'Order Confirmed', icon: '📝', desc: 'Kitchen accepted your order' },
  { key: 'preparing', label: 'Cooking in Kitchen', icon: '👨‍🍳', desc: 'Preparing your fresh items right now' },
  { key: 'ready', label: 'Parcel Ready for Pickup!', icon: '🛍️', desc: 'Your hot food is packed and ready at counter' },
  { key: 'delivered', label: 'Collected & Delivered', icon: '🎉', desc: 'Verified with 4-digit code and handed over' },
]

// Live countdown hook for customer track page
function useCustomerCountdown(targetTimeStr?: string, startTimeStr?: string) {
  const [countdown, setCountdown] = useState<{ minutes: number; seconds: number; isExpired: boolean; progressPercent: number }>({
    minutes: 0,
    seconds: 0,
    isExpired: false,
    progressPercent: 0,
  })

  useEffect(() => {
    if (!targetTimeStr) return

    const tick = () => {
      const now = Date.now()
      const target = new Date(targetTimeStr).getTime()
      const start = startTimeStr ? new Date(startTimeStr).getTime() : target - 20 * 60 * 1000
      const diff = target - now

      if (diff <= 0) {
        setCountdown({ minutes: 0, seconds: 0, isExpired: true, progressPercent: 100 })
        return
      }

      const totalDuration = Math.max(target - start, 1000)
      const elapsed = Math.max(now - start, 0)
      const progressPercent = Math.min(Math.round((elapsed / totalDuration) * 100), 100)

      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown({ minutes: m, seconds: s, isExpired: false, progressPercent })
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [targetTimeStr, startTimeStr])

  return countdown
}

export default function TrackOrderPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bannerAlert, setBannerAlert] = useState<string | null>(null)
  const lastStatusRef = useRef<string>('')

  // Play a gentle notification chime using Web Audio API
  const playAlertSound = (type = 'update') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.connect(gain)
      gain.connect(audioCtx.destination)

      if (type === 'ready' || type === 'delivered') {
        // High celebratory chime
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15) // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.5)
      } else {
        // Soft double beep
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime) // C5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.3)
      }
    } catch (e) {
      // Audio not permitted or user hasn't interacted yet
    }
  }

  useEffect(() => {
    if (!id) return

    orderAPI.track(id as string)
      .then(res => {
        setOrder(res.data.order)
        lastStatusRef.current = res.data.order.status
        if (res.data.order && res.data.order.status !== 'delivered' && res.data.order.status !== 'cancelled' && res.data.order.status !== 'collected') {
          try {
            localStorage.setItem('tasty_active_order', JSON.stringify({
              id: res.data.order._id,
              orderNumber: res.data.order.orderNumber,
              status: res.data.order.status,
              total: res.data.order.total,
              fulfillmentType: res.data.order.fulfillmentType,
            }))
          } catch (e) {}
        } else {
          try {
            localStorage.removeItem('tasty_active_order')
          } catch (e) {}
        }
      })
      .catch(err => {
        console.error(err)
        try {
          localStorage.removeItem('tasty_active_order')
        } catch (e) {}
      })
      .finally(() => setLoading(false))

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'
    const socket = io(socketUrl)

    socket.emit('joinOrderRoom', id)
    socket.on('orderUpdate', (data: any) => {
      const updatedOrder = data.order || data
      const newStatus = data.status || updatedOrder.status

      if (data.notificationMessage) {
        setBannerAlert(data.notificationMessage)
      }

      if (newStatus && newStatus !== lastStatusRef.current) {
        lastStatusRef.current = newStatus
        playAlertSound(newStatus === 'ready' || newStatus === 'delivered' || newStatus === 'collected' ? 'ready' : 'update')

        if (newStatus === 'preparing') {
          toast('👨‍🍳 The kitchen has started cooking your order!', { icon: '🔥', duration: 5000 })
        } else if (newStatus === 'ready') {
          toast.success('🛍️ Your parcel is ready for collection! Please have your 4-digit PIN ready.', { duration: 6000 })
        } else if (newStatus === 'out_for_delivery') {
          toast('🛵 Your order is out for delivery! Driver is en route.', { icon: '🚚', duration: 5000 })
        } else if (newStatus === 'delivered' || newStatus === 'collected') {
          toast.success('🎉 Order delivered! Enjoy your meal.', { duration: 6000 })
          try {
            localStorage.removeItem('tasty_active_order')
          } catch (e) {}
        } else if (newStatus === 'cancelled') {
          try {
            localStorage.removeItem('tasty_active_order')
          } catch (e) {}
        }
      }

      setOrder((prev: any) => ({
        ...prev,
        ...updatedOrder,
        ...(data.driver ? { driver: data.driver } : {}),
        ...(data.estimatedDeliveredTime ? { estimatedDeliveredTime: data.estimatedDeliveredTime } : {}),
        ...(data.estimatedDeliveryMinutes ? { estimatedDeliveryMinutes: data.estimatedDeliveryMinutes } : {}),
        status: newStatus,
      }))
    })

    return () => {
      socket.disconnect()
    }
  }, [id])

  const isCollection = order?.fulfillmentType === 'collection'
  const steps = isCollection ? COLLECTION_STEPS : DELIVERY_STEPS

  // Target timer for live countdown
  const isCooking = order?.status === 'preparing'
  const isOut = order?.status === 'out_for_delivery'
  const targetTime = isCooking
    ? order?.estimatedReadyTime
    : isOut
    ? order?.estimatedDeliveredTime
    : null
  const startTime = isCooking
    ? order?.cookingStartedAt
    : order?.estimatedReadyTime

  const countdown = useCustomerCountdown(targetTime, startTime)

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full" />
          <p className="text-xs text-gray-500 font-medium">Connecting to kitchen live stream...</p>
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
          <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
          <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
          <p className="text-gray-500 mb-6 text-sm">Could not retrieve live tracker for this order ID.</p>
          <Link href="/menu" className="btn-primary">Back to Menu</Link>
        </div>
        <Footer />
      </>
    )
  }

  // Calculate current active step index
  const getStepIndex = (status: string) => {
    if (status === 'pending') return 0
    if (status === 'confirmed') return 0
    if (status === 'preparing') return 1
    if (status === 'ready') return 2
    if (status === 'out_for_delivery') return 2
    if (status === 'delivered' || status === 'collected') return 3
    return 0
  }

  const currentStepIdx = getStepIndex(order.status)
  const isCompleted = order.status === 'delivered' || order.status === 'collected'

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream py-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Top Back bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-dark hover:text-primary-600 font-bold bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm transition-all hover:border-primary-300"
              >
                🏠 Return to Main Page
              </Link>
              <Link
                href="/menu"
                className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-primary-600 font-medium transition-colors bg-white/70 px-2.5 py-1.5 rounded-xl border border-gray-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Menu
              </Link>
            </div>

            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              Live Kitchen Tracker Active
            </span>
          </div>

          {/* Real-time Broadcast Banner Alert from Kitchen */}
          {bannerAlert && (
            <div className="mb-6 p-4 rounded-2xl bg-primary-600 text-white shadow-lg flex items-start justify-between gap-3 animate-fade-in border border-primary-500">
              <div className="flex items-start gap-3">
                <BellRing className="w-5 h-5 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary-200 block">
                    Message from Kitchen
                  </span>
                  <p className="text-sm font-medium">{bannerAlert}</p>
                </div>
              </div>
              <button
                onClick={() => setBannerAlert(null)}
                className="text-primary-200 hover:text-white p-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Hero Status Card */}
          <div className="card p-6 mb-6 text-center overflow-hidden relative shadow-lg">
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                isCollection ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                {isCollection ? '🏃 Counter Collection' : '🚚 Home Delivery'}
              </span>
            </div>

            <div className="text-5xl mb-3 animate-bounce-subtle">
              {order.status === 'preparing' && '👨‍🍳'}
              {order.status === 'ready' && '🛍️'}
              {order.status === 'out_for_delivery' && '🛵'}
              {order.status === 'confirmed' && '✅'}
              {order.status === 'pending' && '📝'}
              {order.status === 'cancelled' && '🛑'}
              {(order.status === 'delivered' || order.status === 'collected') && '🎉'}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-dark mb-1">
              {order.status === 'preparing' && 'Kitchen is Cooking Your Food!'}
              {order.status === 'ready' && 'Parcel Ready for Collection!'}
              {order.status === 'out_for_delivery' && 'Out for Delivery!'}
              {order.status === 'confirmed' && 'Order Confirmed by Kitchen'}
              {order.status === 'pending' && 'Order Received'}
              {order.status === 'cancelled' && 'Order Could Not Be Accepted'}
              {order.status === 'delivered' && 'Order Delivered! Enjoy!'}
              {order.status === 'collected' && 'Order Collected & Verified!'}
            </h1>
            <p className="text-xs text-gray-500 font-mono mb-4">Order ID: {order.orderNumber}</p>

            {/* Rejection / Cancellation Notice */}
            {order.status === 'cancelled' && (
              <div className="my-5 p-5 rounded-2xl bg-red-50 border-2 border-red-300 text-left text-red-950">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <h3 className="font-bold text-sm text-red-900">Reason for Cancellation:</h3>
                    <p className="text-xs text-red-800 font-medium mt-1">
                      {order.rejectionReason || 'The kitchen is at peak capacity and unable to process this ticket.'}
                    </p>
                    <p className="text-[11px] text-red-700 mt-2 font-semibold">
                      {order.paymentStatus === 'refunded'
                        ? '💳 Your payment was immediately refunded in full. It will appear on your card statement within standard bank processing time.'
                        : '💵 As this was cash on delivery, no charges have been made.'}
                    </p>
                    <p className="text-[11px] text-red-600 mt-1">
                      Hotline support: +44 161 998 7654 (RS Kerala Cafe Northenden)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Status Pill */}
            <div className={`my-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              order.paymentMethod === 'cash' || order.paymentStatus === 'pending'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-green-50 border-green-300 text-green-900'
            }`}>
              {order.paymentMethod === 'cash' || order.paymentStatus === 'pending' ? (
                <>
                  <span>💵</span>
                  <span><strong>Cash on Handover:</strong> Pay {formatPrice(order.total)} to driver/staff</span>
                </>
              ) : (
                <>
                  <span>💳</span>
                  <span><strong>Paid Online:</strong> {formatPrice(order.total)} (Ref: {order.paymentReference || 'Card'})</span>
                </>
              )}
            </div>

            {/* ⏱️ Live Countdown Timer Box for Cooking & Delivery */}
            {(isCooking || isOut) && targetTime && (
              <div className="my-5 p-5 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100 border-2 border-orange-200 shadow-sm text-left">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-orange-950 font-bold text-sm">
                    <Timer className="w-4 h-4 text-orange-600 animate-spin" />
                    <span>
                      {isCooking ? 'Estimated Cooking Remaining:' : 'Courier Arrival In:'}
                    </span>
                  </div>
                  <div className="font-mono font-black text-2xl text-orange-600 tracking-wider">
                    {countdown.isExpired ? (
                      <span className="text-green-600 text-base animate-pulse">Any Second Now...</span>
                    ) : (
                      `${String(countdown.minutes).padStart(2, '0')}:${String(countdown.seconds).padStart(2, '0')}`
                    )}
                  </div>
                </div>

                {/* Detailed Cooking Time Info from Hotel Management / Admin */}
                {isCooking && (
                  <div className="flex flex-wrap items-center justify-between text-xs text-orange-900 bg-white/70 p-2.5 rounded-xl border border-orange-200/60 mb-2.5 gap-2 font-medium">
                    <span className="flex items-center gap-1 font-bold text-orange-950">
                      👨‍🍳 Chef cooking duration: <span className="bg-orange-500 text-white px-2 py-0.5 rounded-md font-mono">{order.estimatedPrepTime || 20} mins</span>
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-orange-800">
                      {order.cookingStartedAt && (
                        <span>Started: <strong>{new Date(order.cookingStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                      )}
                      {order.estimatedReadyTime && (
                        <span>• Ready by: <strong>~{new Date(order.estimatedReadyTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                <div className="w-full bg-orange-200/70 rounded-full h-2.5 overflow-hidden border border-orange-300/50 mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-1000 rounded-full"
                    style={{ width: `${countdown.progressPercent}%` }}
                  />
                </div>

                <p className="text-[11px] text-orange-800">
                  {isCooking
                    ? isCollection
                      ? '⚡ Your parcel will automatically be marked ready for collection when this cooking timer finishes.'
                      : '⚡ Your order will automatically be dispatched out for delivery when this cooking timer finishes.'
                    : '⚡ The status will automatically update to delivered when the courier arrives.'}
                </p>
              </div>
            )}

            {/* 🛵 Delivery Driver Contact Card */}
            {order.status === 'out_for_delivery' && (
              <div className="my-5 p-5 rounded-2xl bg-white border-2 border-blue-400 shadow-lg text-left animate-fade-in">
                <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shadow-sm">
                      🛵
                    </span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                        Assigned Courier
                      </span>
                      <h4 className="font-bold text-base text-dark">
                        {order.driver?.name || 'RS Kerala Cafe Express Courier'}
                      </h4>
                    </div>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 font-semibold px-2.5 py-1 rounded-full">
                    {order.driver?.vehicle || 'Delivery Scooter'}
                  </span>
                </div>

                <p className="text-xs text-gray-600 mb-3">
                  Your delivery driver is on their way with your hot meal. Need to provide buzzer codes or parking directions? Call them directly:
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <a
                    href={`tel:${order.driver?.phone || '07700900555'}`}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4 animate-bounce" />
                    <span>Call Driver ({order.driver?.phone || '07700 900555'})</span>
                  </a>

                  <div className="text-center sm:text-right px-4 py-2 bg-blue-50/80 rounded-xl border border-blue-200 text-xs">
                    <span className="text-blue-600 block text-[10px] font-semibold uppercase">Est. Arrival Time</span>
                    <span className="font-bold text-blue-950 font-mono text-sm">
                      {order.estimatedDeliveryMinutes ? `~${order.estimatedDeliveryMinutes} mins` : '~15 mins'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 4-digit Handover PIN Highlight (For BOTH Collection AND Delivery) */}
            {order.status !== 'cancelled' && (
              <div className="my-4 bg-gradient-to-r from-primary-600 via-primary-700 to-dark text-white p-5 rounded-2xl shadow-lg border border-primary-500">
                <span className="inline-block bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-1">
                  {isCollection ? 'Counter Collection Verification PIN' : 'Doorstep Delivery Verification PIN'}
                </span>
                <p className="text-xs text-primary-100 mt-1">
                  {isCollection
                    ? 'Show this 4-digit PIN to kitchen counter staff upon collection:'
                    : 'Give this 4-digit PIN to the delivery driver at your doorstep to confirm delivery:'}
                </p>
                <div className="text-4xl font-mono font-black tracking-[0.3em] my-2 bg-white/15 py-2 px-6 rounded-xl inline-block border border-white/25 shadow-inner">
                  {order.deliveryPin || order.collectionPin || order.handoverPin || '5391'}
                </div>
                <p className="text-[11px] text-primary-200 mt-1">
                  {isCollection
                    ? '📍 Pickup at: RS Kerala Cafe, 303 Palatine Rd, Northenden, Manchester, M22 4HH'
                    : `📍 Delivering to: ${order.deliveryAddress?.line1 || ''}, ${order.deliveryAddress?.postcode || ''}`}
                </p>
                {order.status === 'ready' && isCollection && (
                  <div className="mt-2 bg-yellow-400 text-dark font-bold text-xs py-1.5 px-3 rounded-lg animate-pulse inline-block">
                    ⚡ Hot & Packed! Ready at Counter
                  </div>
                )}
                {order.status === 'out_for_delivery' && (
                  <div className="mt-2 bg-blue-400 text-slate-950 font-bold text-xs py-1.5 px-3 rounded-lg animate-pulse inline-block">
                    🛵 Courier En Route! Have PIN & Cash (if unpaid) Ready
                  </div>
                )}
              </div>
            )}

            {/* Completed Celebration Box */}
            {isCompleted && (
              <div className="my-4 bg-green-50 border border-green-200 text-green-800 p-4 rounded-2xl">
                <p className="font-bold text-sm flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-green-600" /> Meal Handed Over & Enjoyed!
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Thank you for ordering with RS Kerala Cafe Manchester. We hope you love your food!
                </p>
              </div>
            )}
          </div>

          {/* Interactive Progress Bar */}
          <div className="card p-6 mb-6">
            <h2 className="font-semibold text-dark text-base mb-6 flex items-center justify-between">
              <span>Live Order Journey</span>
              <span className="text-xs font-medium text-gray-500">
                Step {currentStepIdx + 1} of {steps.length}
              </span>
            </h2>

            <div className="space-y-6">
              {steps.map((st, idx) => {
                const isPassed = currentStepIdx >= idx
                const isCurrent = currentStepIdx === idx

                return (
                  <div
                    key={st.key}
                    className={`flex items-start gap-4 p-3.5 rounded-2xl transition-all ${
                      isCurrent
                        ? 'bg-amber-50/90 border-2 border-amber-400 shadow-md ring-2 ring-amber-200/70 scale-[1.01]'
                        : 'border border-transparent'
                    }`}
                  >
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base font-bold transition-all ${
                          isCurrent
                            ? 'bg-amber-500 text-white ring-4 ring-amber-200 scale-110 shadow-md animate-pulse'
                            : isPassed
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}
                      >
                        {isPassed && !isCurrent ? '✓' : st.icon}
                      </div>

                      {idx < steps.length - 1 && (
                        <div
                          className={`w-0.5 h-10 mt-2 transition-colors duration-500 ${
                            currentStepIdx > idx ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>

                    <div className="pt-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-sm font-bold ${
                            isCurrent
                              ? 'text-amber-900'
                              : isPassed
                              ? 'text-dark'
                              : 'text-gray-400'
                          }`}
                        >
                          {st.label}
                        </p>
                        {isCurrent && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/90 border border-amber-300 px-2.5 py-0.5 rounded-full animate-pulse shadow-sm flex items-center gap-1">
                            <span>⚡</span> CURRENTLY WORKING ON THIS STAGE
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${isCurrent ? 'text-amber-800 font-medium' : 'text-gray-500'}`}>
                        {st.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Order Items Breakdown */}
          <div className="card p-6 mb-6">
            <h3 className="font-semibold text-dark text-sm uppercase tracking-wider mb-4 border-b pb-2">
              Order Items ({order.items?.length || 0})
            </h3>
            <div className="space-y-3">
              {order.items?.map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    {it.image && (
                      <img
                        src={it.image}
                        alt={it.name}
                        className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                      />
                    )}
                    <div>
                      <p className="font-bold text-dark">{it.name}</p>
                      <p className="text-gray-500">Qty: {it.quantity}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-dark">{formatPrice(it.itemTotal)}</span>
                </div>
              ))}

              <div className="border-t pt-3 mt-3 flex justify-between font-bold text-sm text-dark">
                <span>Total Paid:</span>
                <span className="text-primary-600 font-mono text-base">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Delivery / Collection Info Card */}
          <div className="card p-6 mb-6">
            <h3 className="font-semibold text-dark text-sm uppercase tracking-wider mb-4 border-b pb-2">
              Fulfillment Summary
            </h3>

            {isCollection ? (
              <div className="space-y-2 text-xs text-gray-600">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Pickup Kitchen:</strong> RS Kerala Cafe, 303 Palatine Rd, Northenden, Manchester, M22 4HH
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                  <span>Bring your 4-digit code: <strong>{order.collectionPin || '5391'}</strong></span>
                </p>
                <p className="flex items-center gap-2 text-gray-500">
                  <Phone className="w-3.5 h-3.5" /> Kitchen Hotline: +44 161 998 7654
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-gray-600">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Delivering to:</strong> {order.deliveryAddress?.line1}, {order.deliveryAddress?.city} ({order.deliveryAddress?.postcode})
                  </span>
                </p>
                {order.deliveryAddress?.deliveryPreference && (
                  <p className="text-primary-700 font-semibold pl-6">
                    Handover preference: {order.deliveryAddress.deliveryPreference}
                  </p>
                )}
                {order.deliveryAddress?.gateCode && (
                  <p className="text-gray-500 pl-6 font-mono">
                    Gate / Buzzer Code: {order.deliveryAddress.gateCode}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Event Log */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-dark text-xs uppercase tracking-wider mb-3">Kitchen Activity Log</h3>
              <div className="space-y-2">
                {order.statusHistory.slice().reverse().map((hist: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-xs text-gray-600 border-b pb-2 last:border-0">
                    <div>
                      <span className="capitalize font-bold text-dark">{hist.status.replace(/_/g, ' ')}</span>
                      {hist.note && <span className="text-gray-500 ml-2">({hist.note})</span>}
                    </div>
                    <span className="text-gray-400 font-mono">{formatDate(hist.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Bottom Return to Main Page Card */}
          <div className="card p-6 text-center bg-gradient-to-r from-primary-50 via-amber-50 to-orange-50 border-2 border-primary-200 mt-6 shadow-sm">
            <h4 className="font-bold text-dark text-base mb-1">Browsing or Leaving This Screen?</h4>
            <p className="text-xs text-gray-600 mb-4 max-w-md mx-auto">
              You can return to the main homepage anytime. Your active order tracking banner will stay pinned at the top so you won't lose your live status!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="btn-primary w-full sm:w-auto px-6 py-2.5 text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
              >
                🏠 Return to Main Page
              </Link>
              <Link
                href="/menu"
                className="btn-secondary w-full sm:w-auto px-6 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                🍽️ Browse Tasty Menu
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
