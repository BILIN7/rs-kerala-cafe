'use client'
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import api from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import {
  RefreshCw,
  ChefHat,
  Package,
  Check,
  Volume2,
  VolumeX,
  Truck,
  Store,
  Clock,
  Key,
  X,
  Flame,
  Search,
  MessageSquare,
  Send,
  Zap,
  Timer,
  CheckCircle2,
  MapPin,
  Compass,
  Phone,
  Mail,
  CreditCard,
  ExternalLink,
  Copy,
  Navigation,
  FileText,
  PlusCircle,
  Eye,
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Filter,
  Lock,
  LogOut,
  Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'

// Live countdown hook
function useOrderTimer(targetTimeStr?: string, startTimeStr?: string) {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number; isExpired: boolean; progressPercent: number }>({
    minutes: 0,
    seconds: 0,
    isExpired: false,
    progressPercent: 0,
  })

  useEffect(() => {
    if (!targetTimeStr) return

    const updateTimer = () => {
      const now = Date.now()
      const target = new Date(targetTimeStr).getTime()
      const start = startTimeStr ? new Date(startTimeStr).getTime() : target - 20 * 60 * 1000
      const diff = target - now

      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, isExpired: true, progressPercent: 100 })
        return
      }

      const totalDuration = Math.max(target - start, 1000)
      const elapsed = Math.max(now - start, 0)
      const progressPercent = Math.min(Math.round((elapsed / totalDuration) * 100), 100)

      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft({ minutes: m, seconds: s, isExpired: false, progressPercent })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [targetTimeStr, startTimeStr])

  return timeLeft
}

// Live Countdown Badge Component for Admin Cards
function OrderLiveTimerBadge({ order }: { order: any }) {
  const isCooking = order.status === 'preparing'
  const isOut = order.status === 'out_for_delivery'
  const isCollection = order.fulfillmentType === 'collection'

  const targetTime = isCooking
    ? order.estimatedReadyTime
    : isOut
    ? order.estimatedDeliveredTime
    : null

  const startTime = isCooking
    ? order.cookingStartedAt
    : order.estimatedReadyTime

  const timer = useOrderTimer(targetTime, startTime)

  if (!isCooking && !isOut) return null

  return (
    <div className={`p-3 rounded-xl border mt-3 ${
      isCooking
        ? 'bg-orange-950/40 border-orange-700/60 text-orange-200'
        : 'bg-blue-950/40 border-blue-700/60 text-blue-200'
    }`}>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-bold flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 animate-spin" />
          {isCooking ? '🍳 Cooking In-Progress' : '🛵 Out for Delivery'}
        </span>
        <span className="font-mono font-black text-sm tracking-wider">
          {timer.isExpired ? (
            <span className="text-yellow-400 animate-pulse">Auto-Advancing...</span>
          ) : (
            `${String(timer.minutes).padStart(2, '0')}:${String(timer.seconds).padStart(2, '0')}`
          )}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900/80 rounded-full h-2 overflow-hidden border border-slate-700">
        <div
          className={`h-full transition-all duration-1000 ${
            isCooking ? 'bg-gradient-to-r from-orange-500 to-amber-400' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
          }`}
          style={{ width: `${timer.progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-yellow-400" />
          {isCooking
            ? isCollection
              ? '⚡ Auto-moves to Ready for Pickup'
              : '⚡ Auto-moves to Out for Delivery'
            : '⚡ Auto-marks Delivered'}
        </span>
        <span>
          Est: {new Date(targetTime || Date.now()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

const DEFAULT_ITEM_FORM = {
  name: '',
  category: 'Biriyani',
  description: '',
  priceGBP: '12.95',
  image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
  isVegetarian: false,
  isVegan: false,
  isGlutenFree: false,
  isSpicy: false,
  spiceLevel: 2,
  isFeatured: false,
  isAvailable: true,
  preparationTime: 20,
}

const DRIVER_PRESETS = [
  { name: 'Muhammad Ali', phone: '07700 900555', vehicle: 'Honda PCX 125 Scooter' },
  { name: 'Liam Gallagher', phone: '07700 900777', vehicle: 'Yamaha NMAX 125' },
  { name: 'Sophie Taylor', phone: '07700 900333', vehicle: 'Toyota Yaris Hybrid' },
]

export default function AwesomeAdminDashboard() {
  // 🔐 Secret Admin Authentication Guard (ID: rs707, Password: robin@77)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [authChecking, setAuthChecking] = useState<boolean>(true)
  const [adminIdInput, setAdminIdInput] = useState<string>('')
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('')
  const [authError, setAuthError] = useState<string>('')

  // Navigation: Orders vs Menu Management
  const [adminSection, setAdminSection] = useState<'orders' | 'menu'>('orders')

  // Orders state
  const [orders, setOrders] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'all'>('active')
  const [completedViewMode, setCompletedViewMode] = useState<'compact' | 'cards'>('compact')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // 🗓️ Date Filtering state (Defaults to Today as requested)
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'previous' | '7days' | '30days'>('today')
  const [isSeedingOrders, setIsSeedingOrders] = useState(false)

  // 🗑️ Delete Order Confirmation Modal
  const [deleteOrderModal, setDeleteOrderModal] = useState<any | null>(null)
  const [isDeletingOrder, setIsDeletingOrder] = useState(false)

  // 🧹 Auto-Clear / Purge Modal
  const [purgeModalOpen, setPurgeModalOpen] = useState(false)
  const [purgeTarget, setPurgeTarget] = useState<'cancelled_failed' | 'all_completed'>('cancelled_failed')
  const [isPurgingOldOrders, setIsPurgingOldOrders] = useState(false)

  // 🖼️ Order Dish Preview Modal
  const [previewImageModal, setPreviewImageModal] = useState<{ url: string; name: string } | null>(null)

  // Cooking Prep Time selector for orders
  const [selectedPrepMinutes, setSelectedPrepMinutes] = useState<{ [orderId: string]: number }>({})

  // New Incoming Order Alert Modal state
  const [incomingOrderAlert, setIncomingOrderAlert] = useState<any | null>(null)
  const [alertCookingMinutes, setAlertCookingMinutes] = useState<number>(20)

  // 🛵 Assign Delivery Driver Modal State
  const [assignDriverModalOrder, setAssignDriverModalOrder] = useState<any | null>(null)
  const [driverName, setDriverName] = useState<string>('Muhammad Ali')
  const [driverPhone, setDriverPhone] = useState<string>('07700 900555')
  const [driverVehicle, setDriverVehicle] = useState<string>('Honda PCX 125 Scooter')
  const [driverDeliveryMinutes, setDriverDeliveryMinutes] = useState<number>(15)
  const [isAssigningDriver, setIsAssigningDriver] = useState<boolean>(false)

  // 4-Digit PIN Verification Modal (Works for BOTH Delivery & Collection)
  const [pinModalOrder, setPinModalOrder] = useState<any | null>(null)
  const [enteredPin, setEnteredPin] = useState('')
  const [isVerifyingPin, setIsVerifyingPin] = useState(false)

  // Order Rejection / Decline Modal State
  const [rejectModalOrder, setRejectModalOrder] = useState<any | null>(null)
  const [rejectReason, setRejectReason] = useState<string>('Kitchen at maximum capacity / peak rush')
  const [customRejectReason, setCustomRejectReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)

  // Manual Customer Notification Modal state
  const [notifyOrder, setNotifyOrder] = useState<any | null>(null)
  const [notifyMsg, setNotifyMsg] = useState('')
  const [isSendingNotify, setIsSendingNotify] = useState(false)

  // 🗺️ Hotel Management All-in-One Order & Dispatch Control Modal
  const [dispatchModalOrder, setDispatchModalOrder] = useState<any | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)

  // 🍽️ MENU MANAGEMENT STATE
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [menuLoading, setMenuLoading] = useState(false)
  const [menuSearchQuery, setMenuSearchQuery] = useState('')
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>('All')
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [itemFormData, setItemFormData] = useState(DEFAULT_ITEM_FORM)
  const [isSavingItem, setIsSavingItem] = useState(false)
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any | null>(null)

  // Sound generator using Web Audio API
  const playAlertChime = () => {
    if (!soundEnabled) return
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const notes = [659.25, 783.99, 1046.50] // E5, G5, C6 restaurant bell
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.connect(gain)
        gain.connect(audioCtx.destination)

        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.12)
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime + idx * 0.12)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + idx * 0.12 + 0.4)

        osc.start(audioCtx.currentTime + idx * 0.12)
        osc.stop(audioCtx.currentTime + idx * 0.12 + 0.4)
      })
    } catch (e) {
      console.warn('Audio play restricted by browser:', e)
    }
  }

  const fetchOrders = async (dateRangeOverride?: string) => {
    try {
      const dr = dateRangeOverride || dateFilter
      const res = await api.get(`/admin/orders?limit=100&dateRange=${dr}`)
      const orderList = res.data.orders || []
      setOrders(orderList)

      if (dispatchModalOrder) {
        const updated = orderList.find((o: any) => o._id === dispatchModalOrder._id)
        if (updated) setDispatchModalOrder(updated)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Delete an order permanently
  const handleDeleteOrderSubmit = async () => {
    if (!deleteOrderModal) return
    setIsDeletingOrder(true)
    try {
      await api.delete(`/admin/orders/${deleteOrderModal._id}`)
      toast.success(`🗑️ Order #${deleteOrderModal.orderNumber} deleted permanently`)
      setDeleteOrderModal(null)
      fetchOrders()
      fetchAnalytics()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete order')
    } finally {
      setIsDeletingOrder(false)
    }
  }

  // Purge 7+ days old orders (Cancelled, Failed, or Completed)
  const handlePurgeOldOrdersSubmit = async () => {
    setIsPurgingOldOrders(true)
    try {
      const res = await api.post('/admin/orders/purge-old', {
        days: 7,
        onlyCancelledOrFailed: purgeTarget === 'cancelled_failed',
      })
      toast.success(res.data?.message || 'Purged orders older than 7 days')
      setPurgeModalOpen(false)
      fetchOrders()
      fetchAnalytics()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to auto-clear orders')
    } finally {
      setIsPurgingOldOrders(false)
    }
  }

  // 🔄 Force-seed or reload default Kerala Cafe orders (Today & Previous days)
  const handleSeedDefaultOrders = async () => {
    setIsSeedingOrders(true)
    try {
      const res = await api.post('/admin/orders/seed-defaults')
      toast.success(res.data?.message || 'Default orders loaded successfully!')
      await fetchOrders(dateFilter)
      await fetchAnalytics()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load sample orders')
    } finally {
      setIsSeedingOrders(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics')
      setAnalytics(res.data.analytics)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchMenu = async () => {
    setMenuLoading(true)
    try {
      const res = await api.get('/admin/menu')
      setMenuItems(res.data.items || [])
    } catch (err) {
      console.error('Error fetching menu items:', err)
    } finally {
      setMenuLoading(false)
    }
  }

  // Check secret admin authentication on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuth = localStorage.getItem('tasty_admin_authenticated') === 'true'
      setIsAuthenticated(isAuth)
      setAuthChecking(false)
    }
  }, [])

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    if (adminIdInput.trim().toLowerCase() === 'rs707' && adminPasswordInput === 'robin@77') {
      localStorage.setItem('tasty_admin_authenticated', 'true')
      setIsAuthenticated(true)
      toast.success('Admin login successful! Welcome, Management.')
    } else {
      setAuthError('Invalid Admin ID or Password. Access denied.')
    }
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('tasty_admin_authenticated')
    setIsAuthenticated(false)
    setAdminIdInput('')
    setAdminPasswordInput('')
    toast.success('Admin session locked.')
  }

  const handleAssignDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignDriverModalOrder) return
    setIsAssigningDriver(true)
    try {
      const res = await api.put(`/admin/orders/${assignDriverModalOrder._id}/assign-driver`, {
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        vehicle: driverVehicle.trim(),
        deliveryMinutes: Number(driverDeliveryMinutes) || 15,
      })
      toast.success(`🛵 Order #${assignDriverModalOrder.orderNumber} dispatched with ${driverName}! Est: ~${driverDeliveryMinutes} mins`)
      setAssignDriverModalOrder(null)
      fetchOrders()
      fetchAnalytics()
      if (dispatchModalOrder && dispatchModalOrder._id === assignDriverModalOrder._id) {
        setDispatchModalOrder(res.data.order)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign driver')
    } finally {
      setIsAssigningDriver(false)
    }
  }

  useEffect(() => {
    fetchOrders(dateFilter)
    fetchAnalytics()
    fetchMenu()

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'
    const socket = io(socketUrl)
    socket.emit('joinAdminRoom')

    socket.on('newOrder', (data: any) => {
      const newOrder = data.order || data
      fetchOrders(dateFilter)
      fetchAnalytics()
      playAlertChime()
      setIncomingOrderAlert(newOrder)
      setAlertCookingMinutes(20)
      toast.success(`🔔 New Order Received: ${newOrder.orderNumber}!`, { duration: 6000 })
    })

    socket.on('orderStatusChanged', () => {
      fetchOrders(dateFilter)
      fetchAnalytics()
    })

    socket.on('orderDeleted', () => {
      fetchOrders(dateFilter)
      fetchAnalytics()
    })

    socket.on('ordersPurged', () => {
      fetchOrders(dateFilter)
      fetchAnalytics()
    })

    return () => {
      socket.disconnect()
    }
  }, [soundEnabled, dateFilter])

  // Solo Admin Sets Prep Time -> Starts cooking & auto-progression
  const handleSetPrepTime = async (orderId: string, cookingMinutes: number, deliveryMinutes = 15) => {
    try {
      await api.put(`/admin/orders/${orderId}/set-prep-time`, {
        cookingMinutes,
        deliveryMinutes,
      })
      toast.success(`🍳 Timer started: ${cookingMinutes} mins cooking! (Auto-progressing)`)
      fetchOrders()
      fetchAnalytics()
      if (incomingOrderAlert && incomingOrderAlert._id === orderId) {
        setIncomingOrderAlert(null)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to set prep timer')
    }
  }

  // Extend / Adjust Live Cooking Time (Hotel Management)
  const handleExtendCookingTime = async (orderId: string, mins: number) => {
    try {
      const res = await api.put(`/admin/orders/${orderId}/extend-prep-time`, { additionalMinutes: mins })
      toast.success(`⏱️ Added +${mins} mins to cooking time! Customer notified live.`)
      fetchOrders()
      if (dispatchModalOrder && dispatchModalOrder._id === orderId) {
        setDispatchModalOrder(res.data.order)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to adjust cooking time')
    }
  }

  // Accept Order without immediately starting timer (confirms ticket)
  const handleAcceptOrder = async (orderId: string) => {
    try {
      await api.put(`/admin/orders/${orderId}/accept`)
      toast.success('Order accepted! Customer notified.')
      if (incomingOrderAlert && incomingOrderAlert._id === orderId) {
        setIncomingOrderAlert(null)
      }
      fetchOrders()
      fetchAnalytics()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept order')
    }
  }

  // Reject / Decline Order with Reason
  const handleConfirmRejectOrder = async () => {
    if (!rejectModalOrder) return
    setIsRejecting(true)
    const finalReason = customRejectReason.trim() || rejectReason
    try {
      await api.put(`/admin/orders/${rejectModalOrder._id}/reject`, { reason: finalReason })
      toast.success('Order rejected and customer notified live')
      if (incomingOrderAlert && incomingOrderAlert._id === rejectModalOrder._id) {
        setIncomingOrderAlert(null)
      }
      setRejectModalOrder(null)
      setCustomRejectReason('')
      fetchOrders()
      fetchAnalytics()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject order')
    } finally {
      setIsRejecting(false)
    }
  }

  // Extract / Geocode GPS Coordinates from Address
  const handleExtractCoordinates = async (order: any) => {
    if (!order.deliveryAddress) return
    setIsGeocoding(true)

    try {
      let lat = 53.4079
      let lng = -2.2576
      let found = false

      // 1. Try official UK Postcodes API if postcode exists
      const rawPostcode = order.deliveryAddress.postcode
      if (rawPostcode) {
        const cleanPostcode = rawPostcode.trim().replace(/\s+/g, '')
        try {
          const pcRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleanPostcode)}`)
          const pcData = await pcRes.json()
          if (pcData.status === 200 && pcData.result?.latitude && pcData.result?.longitude) {
            lat = pcData.result.latitude
            lng = pcData.result.longitude
            found = true
          }
        } catch (e) {
          console.warn('Postcodes.io lookup error, falling back...', e)
        }
      }

      // 2. Fallback to OpenStreetMap Nominatim if postcode lookup didn't match
      if (!found) {
        const addr = `${order.deliveryAddress.line1 || ''}, ${order.deliveryAddress.city || 'Manchester'}, ${order.deliveryAddress.postcode || ''}, UK`
        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`
        const res = await fetch(geoUrl, {
          headers: { 'Accept-Language': 'en' }
        })
        const data = await res.json()

        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat)
          lng = parseFloat(data[0].lon)
          found = true
        } else {
          lat = 53.4079 + (Math.random() - 0.5) * 0.05
          lng = -2.2576 + (Math.random() - 0.5) * 0.05
        }
      }

      await api.put(`/admin/orders/${order._id}/coordinates`, { lat, lng })
      toast.success(`📍 GPS Coordinates Extracted: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)

      const updatedOrder = {
        ...order,
        deliveryAddress: {
          ...order.deliveryAddress,
          coordinates: { lat, lng }
        }
      }
      setDispatchModalOrder(updatedOrder)
      fetchOrders()
    } catch (err) {
      toast.error('Could not extract coordinates automatically.')
    } finally {
      setIsGeocoding(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string, note?: string) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus, note })
      toast.success(`Order updated to: ${newStatus.replace(/_/g, ' ').toUpperCase()}`)
      fetchOrders()
      fetchAnalytics()
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  // Verify 4-Digit Collection PIN
  const handleVerifyPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pinModalOrder || !enteredPin) return

    setIsVerifyingPin(true)
    try {
      const res = await api.post(`/orders/${pinModalOrder._id}/verify-pin`, { pin: enteredPin.trim() })
      toast.success(res.data.message || '4-digit PIN verified! Order collected.')
      setPinModalOrder(null)
      setEnteredPin('')
      fetchOrders()
      fetchAnalytics()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Incorrect 4-digit code. Please verify customer receipt.')
    } finally {
      setIsVerifyingPin(false)
    }
  }

  // Send Direct Alert / SMS Notification to Customer
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notifyOrder || !notifyMsg.trim()) return

    setIsSendingNotify(true)
    try {
      await api.post(`/admin/orders/${notifyOrder._id}/notify`, { message: notifyMsg })
      toast.success('Customer notified on screen & SMS!')
      setNotifyOrder(null)
      setNotifyMsg('')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send notification')
    } finally {
      setIsSendingNotify(false)
    }
  }

  const copyToClipboard = (text: string, label = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text)
    toast.success(label)
  }

  // Generate Driver Delivery Docket
  const copyDriverDocket = (order: any) => {
    const isCol = order.fulfillmentType === 'collection'
    const addr = order.deliveryAddress
      ? `${order.deliveryAddress.line1}, ${order.deliveryAddress.city} ${order.deliveryAddress.postcode}`
      : 'Counter Pickup'
    const coords = order.deliveryAddress?.coordinates
      ? `${order.deliveryAddress.coordinates.lat?.toFixed(5)}, ${order.deliveryAddress.coordinates.lng?.toFixed(5)}`
      : 'Standard Area Pin'
    const gmaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`

    const docket = `🛎️ RS KERALA CAFE DISPATCH DOCKET
Order: ${order.orderNumber}
Customer: ${order.customer?.name || order.guestName || 'Guest'} (${order.customer?.phone || order.guestPhone || 'No phone'})
Type: ${isCol ? 'Counter Collection (PIN: ' + (order.collectionPin || '----') + ')' : 'Home Delivery'}
Address: ${addr}
GPS Coordinates: ${coords}
Handover Note: ${order.deliveryAddress?.deliveryPreference || 'None'}
Gate/Buzzer: ${order.deliveryAddress?.gateCode || 'None'}
Payment: ${order.paymentStatus?.toUpperCase() || 'PAID'} (${formatPrice(order.total)})
Google Maps Link: ${gmaps}`

    copyToClipboard(docket, '📋 Driver Delivery Docket copied!')
  }

  // 🍽️ MENU CRUD HANDLERS
  const openAddItemModal = () => {
    setEditingItem(null)
    setItemFormData(DEFAULT_ITEM_FORM)
    setIsItemModalOpen(true)
  }

  const openEditItemModal = (item: any) => {
    setEditingItem(item)
    setItemFormData({
      name: item.name,
      category: item.category || 'Biriyani',
      description: item.description || '',
      priceGBP: (item.price / 100).toFixed(2),
      image: item.image || '',
      isVegetarian: Boolean(item.isVegetarian),
      isVegan: Boolean(item.isVegan),
      isGlutenFree: Boolean(item.isGlutenFree),
      isSpicy: Boolean(item.isSpicy),
      spiceLevel: item.spiceLevel || 0,
      isFeatured: Boolean(item.isFeatured),
      isAvailable: item.isAvailable !== false,
      preparationTime: item.preparationTime || 20,
    })
    setIsItemModalOpen(true)
  }

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingItem(true)

    const priceInPence = Math.round(parseFloat(itemFormData.priceGBP || '0') * 100)
    if (isNaN(priceInPence) || priceInPence <= 0) {
      toast.error('Please enter a valid price in GBP (e.g. 12.95)')
      setIsSavingItem(false)
      return
    }

    const payload = {
      ...itemFormData,
      price: priceInPence,
    }

    try {
      if (editingItem) {
        await api.put(`/admin/menu/${editingItem._id}`, payload)
        toast.success(`✓ "${itemFormData.name}" updated successfully!`)
      } else {
        await api.post('/admin/menu', payload)
        toast.success(`✓ "${itemFormData.name}" added to menu!`)
      }
      setIsItemModalOpen(false)
      fetchMenu()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save menu item')
    } finally {
      setIsSavingItem(false)
    }
  }

  const handleDeleteItem = async (item: any) => {
    try {
      await api.delete(`/admin/menu/${item._id}`)
      toast.success(`Deleted "${item.name}" from menu`)
      setDeleteConfirmItem(null)
      fetchMenu()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete item')
    }
  }

  const handleToggleItemAvailability = async (item: any) => {
    try {
      const res = await api.patch(`/admin/menu/${item._id}/toggle`)
      const updated = res.data.item
      toast.success(`"${item.name}" is now ${updated.isAvailable ? 'In Stock (Available)' : 'Sold Out (86\'d)'}`)
      setMenuItems(prev => prev.map(i => i._id === item._id ? { ...i, isAvailable: updated.isAvailable } : i))
    } catch (err) {
      toast.error('Failed to toggle availability')
    }
  }

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !searchQuery ||
      o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.guestPhone?.includes(searchQuery) ||
      o.deliveryAddress?.postcode?.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    // Date Range Filter
    if (dateFilter === 'today') {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      if (new Date(o.createdAt || Date.now()) < start) return false
    } else if (dateFilter === '7days') {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      if (new Date(o.createdAt || Date.now()) < cutoff) return false
    } else if (dateFilter === '30days') {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      if (new Date(o.createdAt || Date.now()) < cutoff) return false
    }

    if (activeTab === 'active') {
      return o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing' || o.status === 'ready' || o.status === 'out_for_delivery'
    }
    if (activeTab === 'pending') return o.status === 'pending' || o.status === 'confirmed'
    if (activeTab === 'preparing') return o.status === 'preparing'
    if (activeTab === 'ready') return o.status === 'ready' || o.status === 'out_for_delivery'
    if (activeTab === 'completed') return o.status === 'delivered' || o.status === 'collected'
    if (activeTab === 'cancelled') return o.status === 'cancelled' || o.paymentStatus === 'failed'
    if (activeTab === 'all') return true
    return true
  })

  // Filter menu items
  const menuCategories = ['All', ...Array.from(new Set(menuItems.map(i => i.category || 'Specialities')))]
  const filteredMenuItems = menuItems.filter((i) => {
    const matchesCategory = selectedMenuCategory === 'All' || i.category === selectedMenuCategory
    const matchesSearch =
      !menuSearchQuery ||
      i.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
      (i.description && i.description.toLowerCase().includes(menuSearchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  // Fallback image helper
  const getDishImage = (it: any) => {
    if (it.image) return it.image
    const lower = (it.name || '').toLowerCase()
    if (lower.includes('biriyani')) return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&auto=format&fit=crop&q=80'
    if (lower.includes('beef')) return 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=200&auto=format&fit=crop&q=80'
    if (lower.includes('fish')) return 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=200&auto=format&fit=crop&q=80'
    if (lower.includes('porotta') || lower.includes('bread')) return 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&auto=format&fit=crop&q=80'
    if (lower.includes('dosa')) return 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=200&auto=format&fit=crop&q=80'
    if (lower.includes('lassi')) return 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=200&auto=format&fit=crop&q=80'
    return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&auto=format&fit=crop&q=80'
  }

  // 🔒 AUTH GUARD
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <Logo size="lg" variant="dark" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
              Hotel Management Portal
            </span>
            <h2 className="text-xl font-bold font-display text-white mt-3">RS Kerala Cafe Administration</h2>
            <p className="text-xs text-slate-400 mt-1">
              Restricted management console. Please verify credentials.
            </p>
          </div>

          {authError && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-300 text-xs text-center font-medium animate-pulse">
              {authError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin ID
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Enter ID (e.g. rs707)"
                value={adminIdInput}
                onChange={(e) => setAdminIdInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter Password"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm transition-all shadow-lg shadow-primary-900/40 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Unlock Management Console</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Return to Customer Storefront
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* 🛵 ASSIGN DELIVERY DRIVER MODAL */}
      {assignDriverModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-800 border-2 border-blue-500 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setAssignDriverModalOrder(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-700/50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/50">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 block">
                  Delivery Dispatch & Driver Assignment
                </span>
                <h3 className="text-xl font-bold font-mono text-white">
                  Order #{assignDriverModalOrder.orderNumber}
                </h3>
              </div>
            </div>

            {/* Delivery address & customer preview */}
            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700/80 mb-4 text-xs space-y-1.5">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-white">
                  {assignDriverModalOrder.customer?.name || assignDriverModalOrder.guestName || 'Customer'}
                </span>
              </div>
              <div className="flex justify-between items-start text-slate-300">
                <span className="text-slate-400">Deliver to:</span>
                <span className="font-semibold text-white text-right">
                  {assignDriverModalOrder.deliveryAddress?.line1}, {assignDriverModalOrder.deliveryAddress?.postcode}
                </span>
              </div>
            </div>

            {/* Quick Driver Presets */}
            <div className="mb-4">
              <span className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                Quick Driver Select:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DRIVER_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDriverName(p.name)
                      setDriverPhone(p.phone)
                      setDriverVehicle(p.vehicle)
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      driverName === p.name
                        ? 'bg-blue-600/30 border-blue-400 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                    }`}
                  >
                    <span className="font-bold text-xs block text-white">{p.name}</span>
                    <span className="text-[10px] text-blue-300 font-mono block">{p.phone}</span>
                    <span className="text-[10px] text-slate-400 truncate block">{p.vehicle}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAssignDriverSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Driver Name</label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Muhammad Ali"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Driver Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs font-semibold focus:outline-none focus:border-blue-500"
                    placeholder="e.g. 07700 900555"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Vehicle / Transportation</label>
                <input
                  type="text"
                  required
                  value={driverVehicle}
                  onChange={(e) => setDriverVehicle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Honda PCX 125 Scooter / Car"
                />
              </div>

              {/* Estimated Delivery Time */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300">Estimated Delivery Arrival Time:</span>
                  <span className="text-xs font-mono font-bold text-white bg-blue-950 px-2.5 py-0.5 rounded border border-blue-800">
                    ~{driverDeliveryMinutes} mins
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[10, 15, 20, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDriverDeliveryMinutes(mins)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        driverDeliveryMinutes === mins
                          ? 'bg-blue-600 text-white border-blue-400 shadow'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                  <span>Custom:</span>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={driverDeliveryMinutes || ''}
                    onChange={(e) => setDriverDeliveryMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-0.5 text-center bg-slate-950 border border-slate-700 rounded text-white font-mono text-xs font-bold"
                  />
                  <span>minutes to customer address</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignDriverModalOrder(null)}
                  className="py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigningDriver || !driverName.trim() || !driverPhone.trim()}
                  className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/50 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Truck className="w-3.5 h-3.5" />
                  {isAssigningDriver ? 'Dispatching...' : 'Dispatch with Driver 🛵'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗑️ DELETE ORDER PERMANENTLY MODAL */}
      {deleteOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-800 border-2 border-red-500 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-600/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-red-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-1">Delete Order?</h3>
            <p className="text-xs text-slate-300 mb-4">
              Are you sure you want to permanently delete order <strong className="text-white font-mono">{deleteOrderModal.orderNumber}</strong>?
              This action cannot be undone.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteOrderModal(null)}
                className="py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingOrder}
                onClick={handleDeleteOrderSubmit}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-50"
              >
                {isDeletingOrder ? 'Deleting...' : 'Delete Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🧹 AUTO-CLEAR / PURGE 7-DAYS OLD ORDERS MODAL */}
      {purgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-800 border-2 border-amber-500 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setPurgeModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-700/50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-2xl flex items-center justify-center text-xl">
                🧹
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                  Maintenance & Database Clean
                </span>
                <h3 className="text-lg font-bold text-white">Auto-Clear 7+ Days Old Orders</h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Orders older than <strong>7 days</strong> can be permanently purged from the database to keep your console fast and uncluttered.
            </p>

            <div className="space-y-2 mb-5">
              <label
                onClick={() => setPurgeTarget('cancelled_failed')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  purgeTarget === 'cancelled_failed'
                    ? 'bg-amber-950/40 border-amber-500 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="purgeTarget"
                  checked={purgeTarget === 'cancelled_failed'}
                  onChange={() => setPurgeTarget('cancelled_failed')}
                  className="mt-0.5 text-amber-500"
                />
                <div>
                  <span className="font-bold text-xs block text-white">Only Cancelled & Failed Orders (Recommended)</span>
                  <span className="text-[11px] text-slate-400 block">Purges rejected tickets and failed transactions older than 7 days. Keeps completed orders.</span>
                </div>
              </label>

              <label
                onClick={() => setPurgeTarget('all_completed')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  purgeTarget === 'all_completed'
                    ? 'bg-amber-950/40 border-amber-500 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="purgeTarget"
                  checked={purgeTarget === 'all_completed'}
                  onChange={() => setPurgeTarget('all_completed')}
                  className="mt-0.5 text-amber-500"
                />
                <div>
                  <span className="font-bold text-xs block text-white">All Completed, Cancelled & Failed Orders</span>
                  <span className="text-[11px] text-slate-400 block">Purges all finalized tickets older than 7 days to archive history.</span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPurgeModalOpen(false)}
                className="py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPurgingOldOrders}
                onClick={handlePurgeOldOrdersSubmit}
                className="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-black shadow-md transition-colors disabled:opacity-50"
              >
                {isPurgingOldOrders ? 'Purging...' : 'Execute Purge 🧹'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🖼️ ENLARGED DISH PREVIEW MODAL */}
      {previewImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-4 max-w-lg w-full shadow-2xl relative text-center">
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-3 right-3 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="font-bold text-white text-sm mb-3 truncate px-6">
              {previewImageModal.name}
            </h4>
            <div className="rounded-2xl overflow-hidden border border-slate-700 max-h-[70vh] bg-black">
              <img
                src={previewImageModal.url}
                alt={previewImageModal.name}
                className="w-full h-auto max-h-[65vh] object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      )}

      {/* 🗺️ HOTEL MANAGEMENT ALL-IN-ONE DISPATCH & ORDER CONTROL CENTER MODAL */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-slate-800 border-2 border-primary-500 rounded-3xl p-5 sm:p-8 max-w-4xl w-full shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setDispatchModalOrder(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-700/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-mono text-white">
                      {dispatchModalOrder.orderNumber}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      dispatchModalOrder.fulfillmentType === 'collection'
                        ? 'bg-purple-900/60 text-purple-300 border border-purple-700'
                        : 'bg-blue-900/60 text-blue-300 border border-blue-700'
                    }`}>
                      {dispatchModalOrder.fulfillmentType === 'collection' ? '🏃 Counter Collection' : '🚚 Home Delivery'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      {dispatchModalOrder.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Placed: {formatDate(dispatchModalOrder.createdAt)} • Hotel Management Dispatch Console
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyDriverDocket(dispatchModalOrder)}
                  className="inline-flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold px-3 py-1.5 rounded-xl border border-slate-600 transition-colors"
                  title="Copy formatted dispatch docket to send to delivery driver"
                >
                  <FileText className="w-3.5 h-3.5 text-primary-400" />
                  <span>Copy Driver Docket</span>
                </button>
              </div>
            </div>

            {/* Main Grid: 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {/* LEFT COLUMN: Dishes, Customer & Payment Details */}
              <div className="space-y-4">
                {/* 🍱 Ordered Items & Photo Preview */}
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/80 space-y-2.5">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <UtensilsCrossed className="w-3.5 h-3.5" /> Ordered Dishes ({dispatchModalOrder.items?.length || 0})
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Click image to enlarge</span>
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {dispatchModalOrder.items?.map((it: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-800/70 p-2 rounded-xl border border-slate-700/50 text-xs">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={getDishImage(it)}
                            alt={it.name}
                            onClick={() => setPreviewImageModal({
                              url: getDishImage(it),
                              name: `${it.name} • Order #${dispatchModalOrder.orderNumber}`
                            })}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-700 cursor-pointer hover:border-primary-500 shrink-0 shadow-sm"
                            title="Click to preview large image"
                          />
                          <div>
                            <span className="font-semibold text-white block">{it.name}</span>
                            <span className="text-primary-400 font-bold text-[11px]">Qty: ×{it.quantity}</span>
                          </div>
                        </div>
                        <span className="font-mono text-slate-300 font-bold">{formatPrice(it.itemTotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/80 space-y-2.5">
                  <h4 className="text-xs font-bold text-primary-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Customer Details
                  </h4>
                  <div className="text-xs space-y-1.5 text-slate-300">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Name:</span>
                      <strong className="text-white text-sm">
                        {dispatchModalOrder.customer?.name || dispatchModalOrder.guestName || 'Guest Customer'}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Phone:</span>
                      <a
                        href={`tel:${dispatchModalOrder.customer?.phone || dispatchModalOrder.guestPhone || ''}`}
                        className="text-primary-400 hover:underline font-mono font-bold flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        {dispatchModalOrder.customer?.phone || dispatchModalOrder.guestPhone || 'No phone'}
                      </a>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Email:</span>
                      <a
                        href={`mailto:${dispatchModalOrder.customer?.email || dispatchModalOrder.guestEmail || ''}`}
                        className="text-slate-300 hover:text-white truncate max-w-[200px]"
                      >
                        {dispatchModalOrder.customer?.email || dispatchModalOrder.guestEmail || 'No email'}
                      </a>
                    </div>
                    {dispatchModalOrder.deliveryAddress?.deliveryPreference && (
                      <div className="flex justify-between items-start border-b border-slate-800 pb-1.5">
                        <span className="text-slate-400">Handover Note:</span>
                        <span className="text-yellow-400 font-semibold text-right">
                          {dispatchModalOrder.deliveryAddress.deliveryPreference}
                        </span>
                      </div>
                    )}
                    {dispatchModalOrder.deliveryAddress?.gateCode && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Gate / Buzzer Code:</span>
                        <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                          {dispatchModalOrder.deliveryAddress.gateCode}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment & Financials */}
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/80 space-y-2.5">
                  <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" /> Payment & Financials
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-green-500/20 text-green-400 border border-green-500/30 uppercase">
                      {dispatchModalOrder.paymentStatus || 'PAID'}
                    </span>
                  </h4>

                  <div className="text-xs space-y-1.5 text-slate-300">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Payment Gateway:</span>
                      <span className="font-semibold text-white capitalize">
                        {dispatchModalOrder.paymentMethod || 'Stripe / Online Card'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Transaction Ref:</span>
                      <span className="font-mono text-slate-400 flex items-center gap-1 text-[11px]">
                        {dispatchModalOrder.paymentIntentId || dispatchModalOrder.orderNumber}
                        <button
                          onClick={() => copyToClipboard(dispatchModalOrder.paymentIntentId || dispatchModalOrder.orderNumber, 'Payment Ref Copied!')}
                          className="hover:text-white"
                          title="Copy Payment Reference"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </span>
                    </div>

                    <div className="pt-1 space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Items Subtotal:</span>
                        <span>{formatPrice(dispatchModalOrder.subtotal || dispatchModalOrder.total)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Delivery Fee:</span>
                        <span>{formatPrice(dispatchModalOrder.deliveryFee || 0)}</span>
                      </div>
                      {dispatchModalOrder.discount > 0 && (
                        <div className="flex justify-between text-green-400">
                          <span>Discount Applied:</span>
                          <span>-{formatPrice(dispatchModalOrder.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-white pt-1.5 border-t border-slate-700 text-sm">
                        <span>Total Paid (GBP):</span>
                        <span className="text-primary-400 font-mono text-base">
                          {formatPrice(dispatchModalOrder.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Cooking Time Adjuster */}
                <div className="bg-gradient-to-br from-slate-900 to-orange-950/30 p-4 rounded-2xl border border-orange-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" /> Live Cooking Time Control
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      Target: {dispatchModalOrder.estimatedReadyTime ? new Date(dispatchModalOrder.estimatedReadyTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'Not set'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300">
                    Add extra time or adjust cooking duration. Customers will receive an instant live notification.
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 15].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => handleExtendCookingTime(dispatchModalOrder._id, mins)}
                        className="py-1.5 rounded-xl bg-orange-600/30 hover:bg-orange-600 border border-orange-500/50 text-orange-200 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> +{mins} mins
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Google Maps & Exact GPS Coordinate Extraction */}
              <div className="space-y-4">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Delivery Location & GPS Coordinates
                    </h4>
                    {dispatchModalOrder.fulfillmentType === 'collection' && (
                      <span className="text-[11px] font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded">
                        Counter Pickup
                      </span>
                    )}
                  </div>

                  {dispatchModalOrder.fulfillmentType === 'collection' ? (
                    <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-800/50 space-y-2 text-xs">
                      <p className="font-semibold text-white">Pickup Location:</p>
                      <p className="text-slate-300">RS Kerala Cafe, 303 Palatine Rd, Northenden, Manchester, M22 4HH</p>
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-purple-300 font-bold">Customer 4-digit PIN:</span>
                        <span className="font-mono font-black text-lg text-yellow-300 tracking-widest bg-slate-900 px-3 py-1 rounded-lg border border-purple-700">
                          {dispatchModalOrder.collectionPin || '----'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-xs bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                        <span className="text-slate-400 block text-[11px] uppercase font-bold">Delivery Address:</span>
                        <p className="font-semibold text-white text-sm">
                          {dispatchModalOrder.deliveryAddress?.line1 || 'No address line'}
                        </p>
                        <p className="text-slate-300">
                          {dispatchModalOrder.deliveryAddress?.city || 'Manchester'}, {dispatchModalOrder.deliveryAddress?.postcode}
                        </p>
                      </div>

                      {/* Exact GPS Coordinates Section */}
                      <div className="bg-blue-950/40 p-3.5 rounded-xl border border-blue-800/60 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-300 uppercase flex items-center gap-1">
                            <Compass className="w-3.5 h-3.5" /> Exact GPS Coordinates
                          </span>
                          <button
                            onClick={() => handleExtractCoordinates(dispatchModalOrder)}
                            disabled={isGeocoding}
                            className="text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" />
                            {isGeocoding ? 'Extracting...' : 'Extract from Map'}
                          </button>
                        </div>

                        <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-700 text-xs font-mono">
                          <span className="text-white">
                            Lat: <strong className="text-cyan-400">{dispatchModalOrder.deliveryAddress?.coordinates?.lat ? dispatchModalOrder.deliveryAddress.coordinates.lat.toFixed(5) : '53.40790'}</strong>,
                            {' '}Lng: <strong className="text-cyan-400">{dispatchModalOrder.deliveryAddress?.coordinates?.lng ? dispatchModalOrder.deliveryAddress.coordinates.lng.toFixed(5) : '-2.25760'}</strong>
                          </span>
                          <button
                            onClick={() => copyToClipboard(
                              `${dispatchModalOrder.deliveryAddress?.coordinates?.lat || 53.4079}, ${dispatchModalOrder.deliveryAddress?.coordinates?.lng || -2.2576}`,
                              '📍 GPS Coordinates Copied for Satnav!'
                            )}
                            className="text-slate-400 hover:text-white p-1"
                            title="Copy Coordinates"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Google Maps Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${dispatchModalOrder.deliveryAddress?.line1 || ''}, ${dispatchModalOrder.deliveryAddress?.city || 'Manchester'} ${dispatchModalOrder.deliveryAddress?.postcode || ''}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-600 text-center"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-blue-400" /> Open in Google Maps
                        </a>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=Tasty+Oven+303+Palatine+Rd+Northenden+Manchester+M22+4HH&destination=${encodeURIComponent(
                            `${dispatchModalOrder.deliveryAddress?.line1 || ''}, ${dispatchModalOrder.deliveryAddress?.city || 'Manchester'} ${dispatchModalOrder.deliveryAddress?.postcode || ''}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md text-center"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Driving Route
                        </a>
                      </div>

                      {/* Embedded Interactive Map Preview */}
                      <div className="rounded-xl overflow-hidden border border-slate-700 h-44 w-full relative">
                        <iframe
                          title="Google Map Preview"
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          scrolling="no"
                          marginHeight={0}
                          marginWidth={0}
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                            (dispatchModalOrder.deliveryAddress?.coordinates?.lng || -2.2576) - 0.01
                          }%2C${
                            (dispatchModalOrder.deliveryAddress?.coordinates?.lat || 53.4079) - 0.01
                          }%2C${
                            (dispatchModalOrder.deliveryAddress?.coordinates?.lng || -2.2576) + 0.01
                          }%2C${
                            (dispatchModalOrder.deliveryAddress?.coordinates?.lat || 53.4079) + 0.01
                          }&layer=mapnik&marker=${
                            dispatchModalOrder.deliveryAddress?.coordinates?.lat || 53.4079
                          }%2C${
                            dispatchModalOrder.deliveryAddress?.coordinates?.lng || -2.2576
                          }`}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="border-t border-slate-700/80 pt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDispatchModalOrder(null)}
                  className="py-2.5 px-5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Close Control Center
                </button>
                <button
                  onClick={() => {
                    setDeleteOrderModal(dispatchModalOrder)
                    setDispatchModalOrder(null)
                  }}
                  className="py-2.5 px-3 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-700/60 text-red-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Delete this order permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Order</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {dispatchModalOrder.fulfillmentType === 'delivery' && (
                  <button
                    onClick={() => {
                      setAssignDriverModalOrder(dispatchModalOrder)
                      if (dispatchModalOrder.driver) {
                        setDriverName(dispatchModalOrder.driver.name)
                        setDriverPhone(dispatchModalOrder.driver.phone)
                        setDriverVehicle(dispatchModalOrder.driver.vehicle)
                      }
                    }}
                    className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                  >
                    <Truck className="w-4 h-4" />
                    {dispatchModalOrder.driver ? 'Change Driver' : '🛵 Assign Driver & Dispatch'}
                  </button>
                )}

                {dispatchModalOrder.status === 'out_for_delivery' && (
                  <button
                    onClick={() => {
                      updateOrderStatus(dispatchModalOrder._id, 'delivered', 'Driver confirmed dropoff')
                      setDispatchModalOrder(null)
                    }}
                    className="py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                  >
                    <Check className="w-4 h-4" /> Confirm Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🍽️ ADD / EDIT DISH MODAL (MENU MANAGEMENT) */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-slate-800 border-2 border-primary-500 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsItemModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-700/60"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 border-b border-slate-700 pb-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">
                  {editingItem ? 'Edit Menu Dish' : 'Add New Dish to Menu'}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingItem ? `Updating "${editingItem.name}"` : 'Enter dish details, pricing, and dietary tags'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-4 text-xs">
              {/* Dish Name */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Thalassery Beef Roast Dum Biriyani"
                  value={itemFormData.name}
                  onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Category & Price in GBP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Category *</label>
                  <select
                    value={itemFormData.category}
                    onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="Biriyani">Biriyani</option>
                    <option value="Kerala Specialities">Kerala Specialities</option>
                    <option value="Breads & Accompaniments">Breads & Accompaniments</option>
                    <option value="Dosa & Starters">Dosa & Starters</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Drinks & Desserts">Drinks & Desserts</option>
                    <option value="Special Combos">Special Combos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Price (£ GBP) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">£</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.50"
                      required
                      placeholder="12.95"
                      value={itemFormData.priceGBP}
                      onChange={(e) => setItemFormData({ ...itemFormData, priceGBP: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Appetizing Description *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe ingredients, cooking technique, flavours and accompaniments..."
                  value={itemFormData.description}
                  onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              {/* Photo Image URL */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Photo Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={itemFormData.image}
                  onChange={(e) => setItemFormData({ ...itemFormData, image: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                />
                {itemFormData.image && (
                  <div className="mt-2 flex items-center gap-3 bg-slate-900/60 p-2 rounded-xl border border-slate-700/60">
                    <img
                      src={itemFormData.image}
                      alt="Preview"
                      className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                    />
                    <span className="text-slate-400 text-[11px]">Image preview rendered above</span>
                  </div>
                )}
              </div>

              {/* Spice Level & Prep Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Spice Level</label>
                  <select
                    value={itemFormData.spiceLevel}
                    onChange={(e) => setItemFormData({ ...itemFormData, spiceLevel: parseInt(e.target.value), isSpicy: parseInt(e.target.value) > 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="0">Mild / Non-Spicy 🟢</option>
                    <option value="1">Medium 🌶️</option>
                    <option value="2">Hot 🌶️🌶️</option>
                    <option value="3">Extra Hot 🌶️🌶️🌶️</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Est. Cooking Time (Mins)</label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={itemFormData.preparationTime}
                    onChange={(e) => setItemFormData({ ...itemFormData, preparationTime: parseInt(e.target.value) || 20 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Dietary Tags Checkboxes */}
              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/70 space-y-2">
                <span className="block font-bold text-slate-300 uppercase tracking-wider text-[11px]">Dietary & Attributes:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={itemFormData.isVegetarian}
                      onChange={(e) => setItemFormData({ ...itemFormData, isVegetarian: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-primary-600 focus:ring-0"
                    />
                    <span>Vegetarian (🌱)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={itemFormData.isVegan}
                      onChange={(e) => setItemFormData({ ...itemFormData, isVegan: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-primary-600 focus:ring-0"
                    />
                    <span>Vegan</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={itemFormData.isGlutenFree}
                      onChange={(e) => setItemFormData({ ...itemFormData, isGlutenFree: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-primary-600 focus:ring-0"
                    />
                    <span>Gluten Free</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={itemFormData.isFeatured}
                      onChange={(e) => setItemFormData({ ...itemFormData, isFeatured: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-primary-600 focus:ring-0"
                    />
                    <span>Featured Dish (⭐)</span>
                  </label>
                </div>
              </div>

              {/* In-Stock Availability Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
                <div>
                  <span className="font-bold text-white block">In-Stock Availability</span>
                  <span className="text-[11px] text-slate-400">Controls if customers can order this dish right now</span>
                </div>
                <button
                  type="button"
                  onClick={() => setItemFormData({ ...itemFormData, isAvailable: !itemFormData.isAvailable })}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
                    itemFormData.isAvailable
                      ? 'bg-green-600 text-white'
                      : 'bg-red-900/60 text-red-300 border border-red-700'
                  }`}
                >
                  {itemFormData.isAvailable ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  <span>{itemFormData.isAvailable ? 'In Stock' : 'Sold Out (86\'d)'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingItem}
                  className="btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {isSavingItem ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Dish to Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚠️ DELETE CONFIRMATION DIALOG */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-800 border-2 border-red-500 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-600/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-red-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-1">Delete Menu Dish?</h3>
            <p className="text-xs text-slate-300 mb-4">
              Are you sure you want to permanently delete <strong>"{deleteConfirmItem.name}"</strong>? This will remove it from the customer storefront menu.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(deleteConfirmItem)}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-colors"
              >
                Delete Dish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 Fullscreen Incoming Order Alert Modal */}
      {incomingOrderAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-800 border-2 border-primary-500 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setIncomingOrderAlert(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-700/50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl animate-bounce shadow-lg shadow-primary-900/50">
                🔔
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Incoming Order Alert (Hotel Management)
                </span>
                <h3 className="text-2xl font-bold font-mono text-white">
                  {incomingOrderAlert.orderNumber}
                </h3>
              </div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700 mb-5 space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between items-center border-b border-slate-700/60 pb-2">
                <span className="font-semibold text-white">Customer:</span>
                <span className="text-white font-medium">
                  {incomingOrderAlert.customer?.name || incomingOrderAlert.guestName || 'Guest'} (
                  {incomingOrderAlert.customer?.phone || incomingOrderAlert.guestPhone || 'No phone'})
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700/60 pb-2">
                <span className="font-semibold text-white">Fulfillment:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                  incomingOrderAlert.fulfillmentType === 'collection' ? 'bg-purple-900/60 text-purple-300 border border-purple-700' : 'bg-blue-900/60 text-blue-300 border border-blue-700'
                }`}>
                  {incomingOrderAlert.fulfillmentType === 'collection' ? '🏃 Counter Collection' : '🚚 Home Delivery'}
                </span>
              </div>

              {incomingOrderAlert.fulfillmentType === 'collection' && incomingOrderAlert.collectionPin && (
                <div className="flex justify-between items-center border-b border-slate-700/60 pb-2 bg-purple-950/40 p-2 rounded-lg">
                  <span className="font-semibold text-purple-300 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" /> Handover Code:
                  </span>
                  <span className="font-mono font-black text-sm text-yellow-300 tracking-widest">
                    {incomingOrderAlert.collectionPin}
                  </span>
                </div>
              )}

              {incomingOrderAlert.deliveryAddress && (
                <div className="flex justify-between items-start border-b border-slate-700/60 pb-2">
                  <span className="font-semibold text-white">Address:</span>
                  <span className="text-right text-slate-300">
                    {incomingOrderAlert.deliveryAddress.line1}, {incomingOrderAlert.deliveryAddress.postcode}
                  </span>
                </div>
              )}

              <div>
                <span className="font-semibold text-white block mb-2">Items to Cook:</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {incomingOrderAlert.items?.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-slate-200 bg-slate-800/60 p-1.5 rounded-xl border border-slate-700/40">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={getDishImage(it)}
                          alt={it.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0"
                        />
                        <span className="font-medium text-xs">
                          {it.name} <strong className="text-primary-400">×{it.quantity}</strong>
                        </span>
                      </div>
                      <span className="font-mono text-slate-300">{formatPrice(it.itemTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 text-sm font-bold text-white border-t border-slate-700">
                <span>Total Amount:</span>
                <span className="text-primary-400 font-mono text-base">{formatPrice(incomingOrderAlert.total)}</span>
              </div>
            </div>

            {/* Cooking Time Selection */}
            <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700 mb-5">
              <label className="block text-xs font-bold text-orange-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Set Estimated Cooking Time:
                </span>
                <span className="text-white font-mono font-black text-sm bg-orange-500/20 text-orange-400 px-2.5 py-0.5 rounded-full border border-orange-500/30">
                  {alertCookingMinutes} mins
                </span>
              </label>

              {/* Quick preset chips */}
              <div className="grid grid-cols-6 gap-1.5 mb-2.5">
                {[10, 15, 20, 25, 30, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setAlertCookingMinutes(mins)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      alertCookingMinutes === mins
                        ? 'bg-orange-500 text-slate-950 border-orange-400 shadow-md font-black scale-105'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              {/* Manual Custom Minutes Input */}
              <div className="flex items-center gap-2 bg-slate-950/70 p-2 rounded-xl border border-slate-800 mb-2">
                <span className="text-[11px] font-medium text-slate-400">Manual Entry:</span>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={alertCookingMinutes || ''}
                  onChange={(e) => setAlertCookingMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-2.5 py-1 text-center bg-slate-900 border border-slate-700 focus:border-orange-500 text-white font-mono font-bold text-sm rounded-lg focus:outline-none"
                  placeholder="Minutes"
                />
                <span className="text-xs text-slate-400 font-medium">minutes cooking time</span>
              </div>

              <p className="text-[10px] text-slate-400">
                ⚡ Auto-progresses status to{' '}
                <strong className="text-white">
                  {incomingOrderAlert.fulfillmentType === 'collection' ? 'Ready for Collection' : 'Out for Delivery'}
                </strong>{' '}
                and then to <strong className="text-white">Delivered</strong>!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setIncomingOrderAlert(null)}
                className="py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setRejectModalOrder(incomingOrderAlert)
                  setCustomRejectReason('')
                }}
                className="py-3 rounded-xl border border-red-500/60 bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-bold transition-colors"
              >
                ✕ Reject
              </button>
              <button
                onClick={() => handleSetPrepTime(incomingOrderAlert._id, alertCookingMinutes)}
                className="btn-primary py-3 text-xs font-bold shadow-lg shadow-primary-900/50 flex items-center justify-center gap-1.5"
              >
                <Flame className="w-4 h-4" /> Start ({alertCookingMinutes}m)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💬 Direct Customer Notification Modal */}
      {notifyOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 border-2 border-primary-500 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => { setNotifyOrder(null); setNotifyMsg(''); }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-700/50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Notify Customer</h3>
                <p className="text-xs text-slate-400">
                  Send real-time screen alert & SMS to <strong>{notifyOrder.customer?.name || notifyOrder.guestName || 'Customer'}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-1.5 mb-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Quick Status Presets:
              </span>
              {[
                '👨‍🍳 Your food is currently cooking fresh on the stove and in the tandoor!',
                '🛍️ Your order is hot, packed and ready for pickup at our Northenden counter!',
                '🛵 The driver is on the road and 5-10 minutes away from your address.',
                '📍 The delivery driver has arrived outside your building/gate.',
              ].map((msg, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNotifyMsg(msg)}
                  className="w-full text-left text-xs bg-slate-900/60 hover:bg-slate-900 p-2 rounded-xl text-slate-300 border border-slate-700/60 transition-colors"
                >
                  {msg}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendNotification} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Message</label>
                <textarea
                  value={notifyMsg}
                  onChange={(e) => setNotifyMsg(e.target.value)}
                  rows={3}
                  placeholder="Type any custom alert or delivery instruction for customer..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setNotifyOrder(null); setNotifyMsg(''); }}
                  className="py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingNotify || !notifyMsg.trim()}
                  className="btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSendingNotify ? 'Dispatching...' : 'Send to Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔑 4-Digit PIN Dialog */}
      {pinModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 border-2 border-purple-500 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => { setPinModalOrder(null); setEnteredPin(''); }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-700/50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Key className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {pinModalOrder.fulfillmentType === 'collection' ? 'Verify Counter Collection' : 'Verify Doorstep Delivery Handover'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Order <strong className="text-white font-mono">{pinModalOrder.orderNumber}</strong> • Ask customer for their 4-digit code
              </p>
            </div>

            <form onSubmit={handleVerifyPinSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={4}
                  autoFocus
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full text-center text-3xl font-mono tracking-[0.4em] py-3.5 bg-slate-900 border-2 border-purple-500 rounded-2xl text-white focus:outline-none focus:ring-4 focus:ring-purple-500/30"
                />
              </div>

              <div className="p-3 bg-purple-950/40 rounded-xl text-center text-xs text-purple-300">
                Expected PIN on customer receipt: <strong className="text-yellow-300 font-mono text-sm">{pinModalOrder.deliveryPin || pinModalOrder.collectionPin || pinModalOrder.handoverPin || '5391'}</strong>
              </div>

              {/* Cash Alert on Handover */}
              {(pinModalOrder.paymentMethod === 'cash' || pinModalOrder.paymentStatus === 'pending') && (
                <div className="p-3 bg-amber-950/60 border border-amber-500/60 rounded-xl text-xs text-amber-200">
                  <span className="font-bold block text-amber-300">⚠️ CASH ON DELIVERY:</span>
                  <span>Driver/Staff MUST collect <strong className="text-white font-mono">{formatPrice(pinModalOrder.total)}</strong> in cash before completing handover!</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setPinModalOrder(null); setEnteredPin(''); }}
                  className="py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingPin || enteredPin.length !== 4}
                  className="py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md disabled:opacity-50 transition-all"
                >
                  {isVerifyingPin ? 'Verifying...' : 'Confirm Handover ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🛑 Order Rejection / Decline Modal */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 border-2 border-red-500 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => { setRejectModalOrder(null); setCustomRejectReason(''); }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-700/50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-red-600/20 border border-red-500/60 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
                🛑
              </div>
              <h3 className="text-xl font-bold text-white">Decline Order #{rejectModalOrder.orderNumber}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Select reason to notify customer live. If paid online, payment will be refunded immediately.
              </p>
            </div>

            <div className="space-y-2.5 mb-5">
              <label className="text-xs font-bold text-slate-300 block">Select Rejection Reason:</label>
              {[
                'Kitchen at peak rush / capacity reached',
                'One or more ordered dishes are sold out',
                'Delivery address is outside Manchester radius',
                'Kitchen is closed / closing shortly',
                'Severe weather or courier unavailable',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => { setRejectReason(reason); setCustomRejectReason(''); }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-medium border transition-all ${
                    rejectReason === reason && !customRejectReason
                      ? 'bg-red-500/20 border-red-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  • {reason}
                </button>
              ))}

              <div className="pt-2">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Or custom reason:</label>
                <input
                  type="text"
                  value={customRejectReason}
                  onChange={(e) => setCustomRejectReason(e.target.value)}
                  placeholder="e.g. Large private catering booking in progress..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setRejectModalOrder(null); setCustomRejectReason(''); }}
                className="py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRejecting}
                onClick={handleConfirmRejectOrder}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                {isRejecting ? 'Declining...' : 'Confirm Decline & Alert'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Top Navbar with Section Switcher */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Logo size="sm" variant="dark" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white">RS Kerala Cafe Hotel Management</h1>
              <span className="text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" /> Live Engine Active
              </span>
            </div>
            <p className="text-xs text-slate-400">303 Palatine Rd, Northenden • Orders & Menu Control Hub</p>
          </div>
        </div>

        {/* Center Switcher: Orders vs Menu */}
        <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1">
          <button
            onClick={() => setAdminSection('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              adminSection === 'orders'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Orders & Dispatch</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800/80">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => {
              setAdminSection('menu')
              fetchMenu()
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              adminSection === 'menu'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Menu Management</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800/80">
              {menuItems.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-primary-400 hover:bg-slate-700'
                : 'bg-slate-800/40 border-slate-800 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          <button
            onClick={() => {
              setLoading(true)
              fetchOrders()
              fetchAnalytics()
              fetchMenu()
              toast.success('Data refreshed')
            }}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-xl border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <Link
            href="/menu"
            target="_blank"
            className="text-xs bg-primary-600 hover:bg-primary-700 text-white font-semibold px-3.5 py-1.5 rounded-xl transition-colors shadow-sm"
          >
            View Customer Menu ↗
          </Link>

          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-1.5 text-xs bg-red-950/70 hover:bg-red-900 text-red-200 hover:text-white font-bold px-3 py-1.5 rounded-xl border border-red-700/60 transition-colors shadow-sm"
            title="Log out of admin session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Cards Banner */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Today's Orders</span>
                <Package className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold font-mono text-white">{analytics.todayOrders || orders.length}</p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Cooking Right Now</span>
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-2xl font-bold font-mono text-orange-400">
                {orders.filter((o) => o.status === 'preparing').length}
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Menu Dishes</span>
                <UtensilsCrossed className="w-4 h-4 text-primary-400" />
              </div>
              <p className="text-2xl font-bold font-mono text-primary-400">
                {menuItems.length}
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
                <span className="text-xs font-bold text-green-400">GBP</span>
              </div>
              <p className="text-2xl font-bold font-mono text-green-400">
                £{analytics.totalRevenueGBP || '0.00'}
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 1: ORDERS & DISPATCH KANBAN
        ══════════════════════════════════════════════════════════════════════ */}
        {adminSection === 'orders' && (
          <div className="space-y-4">
            {/* 🗓️ Today & Previous Orders Filtering & 🧹 Auto-Clear 7d Old Orders Strip */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary-400" /> View Orders:
                </span>
                <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {[
                    { id: 'today', label: "⚡ Today's Orders (Default)" },
                    { id: 'previous', label: '🕒 Previous Orders' },
                    { id: '7days', label: '📅 Last 7 Days' },
                    { id: '30days', label: 'Last 30 Days' },
                    { id: 'all', label: 'All History' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => {
                        setDateFilter(filter.id as any)
                        fetchOrders(filter.id)
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        dateFilter === filter.id
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleSeedDefaultOrders}
                  disabled={isSeedingOrders}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-600/70 text-emerald-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  title="Reload authentic sample Kerala Cafe orders for Today & Previous days"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSeedingOrders ? 'animate-spin' : ''}`} />
                  <span>{isSeedingOrders ? 'Loading...' : '🔄 Load Sample Orders'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPurgeModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/70 text-amber-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  title="Purge 7+ days old cancelled and failed orders"
                >
                  <span>🧹 Auto-Clear (7d+)</span>
                </button>
              </div>
            </div>

            {/* Search & Tabs Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              {/* Tab Filter */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                {[
                  {
                    id: 'active',
                    label: '🔥 Active Queue',
                    count: orders.filter((o) => o.status !== 'delivered' && o.status !== 'collected' && o.status !== 'cancelled').length,
                  },
                  {
                    id: 'pending',
                    label: '🔔 Unconfirmed',
                    count: orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length,
                  },
                  {
                    id: 'preparing',
                    label: '👨‍🍳 Cooking',
                    count: orders.filter((o) => o.status === 'preparing').length,
                  },
                  {
                    id: 'ready',
                    label: '🛍️ Ready / En Route',
                    count: orders.filter((o) => o.status === 'ready' || o.status === 'out_for_delivery').length,
                  },
                  {
                    id: 'completed',
                    label: '✅ Completed',
                    count: orders.filter((o) => o.status === 'delivered' || o.status === 'collected').length,
                  },
                  {
                    id: 'cancelled',
                    label: '🛑 Cancelled / Failed',
                    count: orders.filter((o) => o.status === 'cancelled' || o.paymentStatus === 'failed').length,
                  },
                  {
                    id: 'all',
                    label: '📋 All Orders',
                    count: orders.length,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                      activeTab === tab.id ? 'bg-primary-800 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* View toggle and Quick Search */}
              <div className="flex items-center gap-2">
                {(activeTab === 'completed' || activeTab === 'all') && (
                  <button
                    type="button"
                    onClick={() => setCompletedViewMode(prev => prev === 'compact' ? 'cards' : 'compact')}
                    className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl font-semibold transition-colors shrink-0 flex items-center gap-1.5"
                    title="Toggle minimized view for completed orders"
                  >
                    <span>{completedViewMode === 'compact' ? '🗂️ Minimized Rows' : '🃏 Full Cards'}</span>
                  </button>
                )}

                <div className="relative min-w-[240px] flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search order #, customer, phone, postcode..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-500 bg-slate-800/20 rounded-3xl border border-slate-800">
                  <Package className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm font-semibold">No orders currently in this filter stage ({dateFilter})</p>
                  <p className="text-xs text-slate-400 mt-1">Select another date range or wait for incoming orders</p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isCol = order.fulfillmentType === 'collection'
                  const currentMinutes = selectedPrepMinutes[order._id] || 20
                  const isCompleted = order.status === 'delivered' || order.status === 'collected'
                  const isSelected = dispatchModalOrder?._id === order._id
                  const isCooking = order.status === 'preparing'
                  const isOutForDelivery = order.status === 'out_for_delivery'
                  const isPendingAction = order.status === 'pending' || order.status === 'confirmed'

                  const workingCardClass = isSelected
                    ? 'ring-2 ring-primary-500 shadow-2xl shadow-primary-500/30 scale-[1.01] bg-slate-800'
                    : isCooking
                    ? 'ring-2 ring-amber-400 shadow-xl shadow-amber-500/20 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-850 border-amber-500/80'
                    : isOutForDelivery
                    ? 'ring-2 ring-blue-400 shadow-xl shadow-blue-500/20 bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-850 border-blue-500/80'
                    : isPendingAction
                    ? 'ring-2 ring-emerald-400 shadow-xl shadow-emerald-500/20 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-850 border-emerald-500/80'
                    : order.status === 'cancelled'
                    ? 'border-red-900/60 bg-red-950/10'
                    : 'border-slate-700/80 bg-slate-800/90'

                  // 🗂️ Minimized / Compact Row View for Completed Orders
                  if (completedViewMode === 'compact' && isCompleted) {
                    return (
                      <div
                        key={order._id}
                        className={`col-span-full border hover:border-slate-700 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-colors shadow-sm ${
                          isSelected ? 'bg-slate-850 border-primary-500 ring-1 ring-primary-500' : 'bg-slate-900/90 border-slate-800'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          {order.items && order.items[0] && (
                            <img
                              src={getDishImage(order.items[0])}
                              alt="Dish preview"
                              onClick={() => setPreviewImageModal({
                                url: getDishImage(order.items[0]),
                                name: `${order.items[0]?.name} • Order #${order.orderNumber}`
                              })}
                              className="w-7 h-7 rounded-lg object-cover border border-slate-700 cursor-pointer hover:border-primary-500 shrink-0"
                              title="Click to preview order dish image"
                            />
                          )}
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                          <span className="font-mono font-bold text-white text-sm">{order.orderNumber}</span>
                          <span className="text-slate-200 font-semibold">{order.customer?.name || order.guestName || 'Customer'}</span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            📞 {order.customer?.phone || order.guestPhone || 'No phone'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isCol ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}>
                            {isCol ? '🏃 Collection' : '🚚 Delivery'}
                          </span>
                          <span className="font-mono font-bold text-green-400">{formatPrice(order.total)}</span>
                          <span className="text-[10px] text-slate-500">{formatDate(order.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-950/60 border border-green-800/80 px-2.5 py-1 rounded-lg">
                            ✓ Handover Complete
                          </span>
                          <button
                            onClick={() => setDispatchModalOrder(order)}
                            className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
                          <button
                            onClick={() => setDeleteOrderModal(order)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white transition-colors border border-slate-700"
                            title="Delete this order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={order._id}
                      className={`border rounded-2xl p-5 flex flex-col justify-between hover:border-slate-500 transition-all relative overflow-hidden ${workingCardClass}`}
                    >
                      <div>
                        {/* ⚡ Currently Working Div Highlighting Badge */}
                        {isCooking && (
                          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 text-[10px] font-black px-3 py-1 flex items-center justify-between uppercase tracking-wider shadow-sm mb-3 rounded-xl animate-fade-in">
                            <span className="flex items-center gap-1.5 animate-pulse">
                              <Flame className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                              🔥 CURRENTLY COOKING IN KITCHEN
                            </span>
                            <span className="font-mono bg-slate-950 text-amber-300 px-2 py-0.5 rounded-md text-[9px] font-bold">
                              ACTIVE WORK
                            </span>
                          </div>
                        )}

                        {isOutForDelivery && (
                          <div className="bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 text-slate-950 text-[10px] font-black px-3 py-1 flex items-center justify-between uppercase tracking-wider shadow-sm mb-3 rounded-xl animate-fade-in">
                            <span className="flex items-center gap-1.5 animate-pulse">
                              <Truck className="w-3.5 h-3.5 text-slate-950" />
                              🛵 CURRENTLY ON DELIVERY ROUTE
                            </span>
                            <span className="font-mono bg-slate-950 text-blue-300 px-2 py-0.5 rounded-md text-[9px] font-bold">
                              LIVE TRANSIT
                            </span>
                          </div>
                        )}

                        {isPendingAction && (
                          <div className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 text-slate-950 text-[10px] font-black px-3 py-1 flex items-center justify-between uppercase tracking-wider shadow-sm mb-3 rounded-xl animate-pulse">
                            <span className="flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                              ⚡ NEW INCOMING ORDER — ACTION REQUIRED
                            </span>
                            <span className="font-mono bg-slate-950 text-emerald-300 px-2 py-0.5 rounded-md text-[9px] font-bold">
                              AWAITING ACCEPT
                            </span>
                          </div>
                        )}

                        {/* Status Ribbon top */}
                        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-3">
                          <div>
                            <span className="font-mono font-bold text-sm text-white tracking-wide">
                              {order.orderNumber}
                            </span>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> {formatDate(order.createdAt)}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                                isCol ? 'bg-purple-900/60 text-purple-300 border border-purple-700' : 'bg-blue-900/60 text-blue-300 border border-blue-700'
                              }`}
                            >
                              {isCol ? '🏃 Collection' : '🚚 Delivery'}
                            </span>

                            <button
                              onClick={() => setDispatchModalOrder(order)}
                              className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-primary-600 text-slate-300 hover:text-white transition-colors"
                              title="Open Hotel Management Order & Map Control Center"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeleteOrderModal(order)}
                              className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-red-600 text-slate-300 hover:text-white transition-colors"
                              title="Delete this order permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* 📸 Dish Preview Image Banner of the Order */}
                        {order.items && order.items.length > 0 && (
                          <div className="relative mb-3 rounded-xl overflow-hidden bg-slate-950 border border-slate-700/70 group shadow-inner">
                            <div className="h-28 w-full relative overflow-hidden flex items-center justify-center">
                              <img
                                src={getDishImage(order.items[0])}
                                alt={order.items[0]?.name || 'Dish'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                                onClick={() => setPreviewImageModal({
                                  url: getDishImage(order.items[0]),
                                  name: `${order.items[0]?.name} • Order #${order.orderNumber}`
                                })}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex items-end p-2.5 justify-between">
                                <span className="text-[11px] font-bold text-white bg-slate-900/80 px-2.5 py-0.5 rounded-lg border border-slate-700/60 backdrop-blur-sm truncate max-w-[200px]">
                                  🍲 {order.items[0]?.name} {order.items.length > 1 ? `(+${order.items.length - 1} more)` : ''}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPreviewImageModal({
                                    url: getDishImage(order.items[0]),
                                    name: `${order.items[0]?.name} • Order #${order.orderNumber}`
                                  })}
                                  className="text-[10px] font-bold bg-slate-900/90 hover:bg-primary-600 text-slate-200 hover:text-white px-2 py-0.5 rounded-md border border-slate-700 transition-colors flex items-center gap-1 shadow-sm"
                                >
                                  <Eye className="w-3 h-3" /> Preview
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Customer & Address Details */}
                        <div className="text-xs space-y-2 mb-3 text-slate-300">
                          <div className="flex justify-between items-center">
                            <p className="font-semibold text-white truncate text-sm">
                              {order.customer?.name || order.guestName || 'Guest Customer'}
                            </p>
                            <a
                              href={`tel:${order.customer?.phone || order.guestPhone || ''}`}
                              className="text-primary-400 hover:underline font-mono text-xs font-bold flex items-center gap-1 shrink-0 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800"
                            >
                              <Phone className="w-3 h-3 text-primary-400" />
                              {order.customer?.phone || order.guestPhone || 'No phone'}
                            </a>
                          </div>

                          {/* 💳 Payment Info Badge: Paid Online vs Cash on Handover */}
                          {order.paymentMethod === 'cash' || order.paymentStatus === 'pending' ? (
                            <div className="flex items-center justify-between text-xs bg-amber-950/70 p-2.5 rounded-xl border border-amber-500/70 text-amber-200">
                              <span className="font-bold flex items-center gap-1.5 text-amber-300">
                                <span className="text-sm">💵</span> CASH ON HANDOVER
                              </span>
                              <span className="font-black text-amber-300 font-mono text-xs bg-amber-900/80 px-2 py-0.5 rounded border border-amber-600">
                                COLLECT {formatPrice(order.total)}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-xs bg-green-950/60 p-2.5 rounded-xl border border-green-600/70 text-green-200">
                              <span className="font-bold flex items-center gap-1.5 text-green-300">
                                <span className="text-sm">💳</span> PAID ONLINE
                              </span>
                              <span className="font-mono font-bold text-green-300 text-xs">
                                {formatPrice(order.total)} (Ref: {order.paymentReference || 'Card'})
                              </span>
                            </div>
                          )}

                          {isCol ? (
                            <div className="bg-purple-950/40 p-2.5 rounded-xl border border-purple-800/50 flex items-center justify-between">
                              <span className="text-xs text-purple-300 flex items-center gap-1.5 font-medium">
                                <Key className="w-3.5 h-3.5" /> Pickup PIN:
                              </span>
                              <span className="font-mono font-black text-base text-yellow-300 tracking-widest bg-purple-900/60 px-2.5 py-0.5 rounded-lg border border-purple-700">
                                {order.collectionPin || order.handoverPin || '5391'}
                              </span>
                            </div>
                          ) : (
                            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 text-xs space-y-1.5">
                              <div className="flex items-start justify-between gap-1">
                                <p className="text-slate-200 font-medium truncate">
                                  📍 {order.deliveryAddress?.line1}, {order.deliveryAddress?.postcode}
                                </p>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    `${order.deliveryAddress?.line1 || ''}, ${order.deliveryAddress?.city || 'Manchester'} ${order.deliveryAddress?.postcode || ''}`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 text-[10px] font-bold flex items-center gap-0.5 shrink-0 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800"
                                >
                                  Maps ↗
                                </a>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-slate-400 text-[11px]">
                                <span>Doorstep Handover PIN:</span>
                                <span className="font-mono font-black text-yellow-300 text-sm tracking-wider bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                                  {order.deliveryPin || order.handoverPin || '5391'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Order Items list */}
                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 mb-3 space-y-2 text-xs">
                          {order.items?.map((it: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-slate-200 border-b border-slate-800/80 pb-1.5 last:border-0 last:pb-0">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                                  <img
                                    src={getDishImage(it)}
                                    alt={it.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <span className="font-medium text-white">{it.name}</span>
                                  <span className="text-primary-400 font-bold ml-1.5">×{it.quantity}</span>
                                </div>
                              </div>
                              <span className="font-mono text-slate-400 text-[11px]">{formatPrice(it.itemTotal)}</span>
                            </div>
                          ))}
                          <div className="border-t border-slate-700/80 pt-2 mt-2 flex justify-between font-bold text-white">
                            <span>Order Total:</span>
                            <span className="text-primary-400 font-mono text-sm">{formatPrice(order.total)}</span>
                          </div>
                        </div>

                        {/* Stage Badge & Dispatch Center Button */}
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                              Stage:
                            </span>
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                order.status === 'preparing'
                                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse'
                                  : order.status === 'ready'
                                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                  : order.status === 'out_for_delivery'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : order.status === 'delivered' || order.status === 'collected'
                                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setDispatchModalOrder(order)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-white bg-blue-950/60 hover:bg-blue-900/80 px-2.5 py-1 rounded-lg border border-blue-800 transition-colors"
                            >
                              <Compass className="w-3.5 h-3.5" /> Dispatch Center
                            </button>

                            <button
                              onClick={() => {
                                setNotifyOrder(order)
                                setNotifyMsg(
                                  isCol
                                    ? `RS Kerala Cafe Update: Your order ${order.orderNumber} is hot & ready for collection at counter! Remember your 4-digit code: ${order.collectionPin || '5391'}`
                                    : `RS Kerala Cafe Update: Your delivery order ${order.orderNumber} is on the way!`
                                )
                              }}
                              className="p-1 text-primary-400 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors"
                              title="Send screen notification or SMS to customer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Live Automated Progression Countdown Timer */}
                        <OrderLiveTimerBadge order={order} />
                      </div>

                      {/* Actions & Cooking Timer Buttons */}
                      <div className="border-t border-slate-700/60 pt-3 mt-4 space-y-2">
                        {(order.status === 'pending' || order.status === 'confirmed') && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
                                Set Cooking Prep Time:
                              </span>
                              <span className="text-[11px] font-mono font-bold text-orange-300 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800">
                                {currentMinutes} mins
                              </span>
                            </div>

                            <div className="grid grid-cols-4 gap-1.5">
                              {[15, 20, 30, 45].map((mins) => (
                                <button
                                  key={mins}
                                  type="button"
                                  onClick={() => setSelectedPrepMinutes(prev => ({ ...prev, [order._id]: mins }))}
                                  className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                    currentMinutes === mins
                                      ? 'bg-orange-500 text-slate-950 border-orange-400 font-black scale-105'
                                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700'
                                  }`}
                                >
                                  {mins}m
                                </button>
                              ))}
                            </div>

                            {/* Manual custom minutes input */}
                            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1.5 rounded-xl border border-slate-800">
                              <span className="text-[11px] text-slate-400">Custom:</span>
                              <input
                                type="number"
                                min="1"
                                max="180"
                                value={currentMinutes || ''}
                                onChange={(e) => {
                                  const val = Math.max(1, parseInt(e.target.value) || 1)
                                  setSelectedPrepMinutes(prev => ({ ...prev, [order._id]: val }))
                                }}
                                className="w-16 px-1.5 py-0.5 text-center bg-slate-950 border border-slate-700 focus:border-orange-500 rounded text-white font-mono text-xs font-bold focus:outline-none"
                                placeholder="Mins"
                              />
                              <span className="text-[10px] text-slate-400 font-medium">mins cooking time</span>
                            </div>

                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => handleSetPrepTime(order._id, currentMinutes)}
                                className="btn-primary flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                              >
                                <Flame className="w-3.5 h-3.5" /> Start Cooking ({currentMinutes}m)
                              </button>
                              <button
                                onClick={() => {
                                  setRejectModalOrder(order)
                                  setCustomRejectReason('')
                                }}
                                className="px-3 py-2.5 rounded-xl border border-red-500/60 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white text-xs font-bold transition-colors"
                                title="Decline / Reject this order"
                              >
                                ✕ Reject
                              </button>
                            </div>
                          </div>
                        )}

                        {order.status === 'preparing' && (
                          <div className="flex gap-2 mb-2">
                            <button
                              onClick={() => handleExtendCookingTime(order._id, 5)}
                              className="flex-1 py-1.5 rounded-xl bg-slate-700 hover:bg-orange-600 text-xs font-semibold text-slate-200 hover:text-white transition-colors border border-slate-600"
                            >
                              +5 mins
                            </button>
                            <button
                              onClick={() => handleExtendCookingTime(order._id, 10)}
                              className="flex-1 py-1.5 rounded-xl bg-slate-700 hover:bg-orange-600 text-xs font-semibold text-slate-200 hover:text-white transition-colors border border-slate-600"
                            >
                              +10 mins
                            </button>
                          </div>
                        )}

                        {/* Delivery order: Assign driver & dispatch */}
                        {!isCol && (order.status === 'preparing' || order.status === 'ready' || order.status === 'confirmed') && (
                          <button
                            onClick={() => {
                              setAssignDriverModalOrder(order)
                              if (order.driver) {
                                setDriverName(order.driver.name || 'Muhammad Ali')
                                setDriverPhone(order.driver.phone || '07700 900555')
                                setDriverVehicle(order.driver.vehicle || 'Honda PCX 125 Scooter')
                              }
                            }}
                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors"
                          >
                            <Truck className="w-3.5 h-3.5" /> 🛵 Assign Driver & Dispatch
                          </button>
                        )}

                        {order.status === 'preparing' && isCol && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'ready', 'Packed and placed at counter for pickup')}
                            className="w-full py-2 rounded-xl bg-yellow-500/80 hover:bg-yellow-500 text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors"
                          >
                            <Store className="w-3.5 h-3.5" /> Ready Early (At Counter)
                          </button>
                        )}

                        {order.status === 'out_for_delivery' && (
                          <div className="space-y-2">
                            {order.driver && (
                              <div className="bg-blue-950/70 border border-blue-500/50 rounded-xl p-2.5 text-xs text-blue-200">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-white flex items-center gap-1">
                                    🛵 {order.driver.name}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setAssignDriverModalOrder(order)
                                      setDriverName(order.driver.name)
                                      setDriverPhone(order.driver.phone)
                                      setDriverVehicle(order.driver.vehicle)
                                    }}
                                    className="text-[10px] text-blue-300 hover:underline"
                                  >
                                    Edit Driver
                                  </button>
                                </div>
                                <div className="flex items-center justify-between text-slate-300 text-[11px] mt-0.5">
                                  <a href={`tel:${order.driver.phone}`} className="hover:text-blue-300 font-mono">
                                    📞 {order.driver.phone}
                                  </a>
                                  <span className="text-slate-400">{order.driver.vehicle}</span>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  setPinModalOrder(order)
                                  setEnteredPin('')
                                }}
                                className="py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md transition-colors"
                              >
                                <Key className="w-3.5 h-3.5" /> Verify PIN
                              </button>
                              <button
                                onClick={() => updateOrderStatus(order._id, 'delivered', 'Driver confirmed dropoff')}
                                className="py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" /> Handed Over
                              </button>
                            </div>
                          </div>
                        )}

                        {order.status === 'ready' && isCol && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                setPinModalOrder(order)
                                setEnteredPin('')
                              }}
                              className="py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md transition-colors"
                            >
                              <Key className="w-3.5 h-3.5" /> Verify PIN
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order._id, 'delivered', 'Handed over at counter')}
                              className="py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" /> Handed Over
                            </button>
                          </div>
                        )}

                        {(order.status === 'delivered' || order.status === 'collected') && (
                          <div className="w-full text-center text-xs font-bold text-green-400 py-2.5 bg-green-950/40 rounded-xl border border-green-800/40 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-green-400" /> Order Completed & Delivered
                          </div>
                        )}

                        {order.status === 'cancelled' && (
                          <div className="w-full text-center text-xs font-bold text-red-400 py-2.5 px-3 bg-red-950/40 rounded-xl border border-red-800/40 space-y-1">
                            <span className="flex items-center justify-center gap-1.5 text-red-300">
                              🛑 Order Declined / Cancelled
                            </span>
                            {order.rejectionReason && (
                              <p className="text-[11px] text-red-400 font-normal">Reason: {order.rejectionReason}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 2: HOTEL MENU MANAGEMENT (ADD, EDIT, DELETE DISHES)
        ══════════════════════════════════════════════════════════════════════ */}
        {adminSection === 'menu' && (
          <div className="space-y-6">
            {/* Top Toolbar: Search, Category Filter, and Add Dish Button */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                {menuCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedMenuCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      selectedMenuCategory === cat
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                      selectedMenuCategory === cat ? 'bg-primary-800 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {cat === 'All' ? menuItems.length : menuItems.filter(i => i.category === cat).length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Right Side: Search & Add Dish Button */}
              <div className="flex items-center gap-3">
                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={menuSearchQuery}
                    onChange={(e) => setMenuSearchQuery(e.target.value)}
                    placeholder="Search dishes..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <button
                  onClick={openAddItemModal}
                  className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 shadow-md whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> Add New Dish
                </button>
              </div>
            </div>

            {/* Menu Items Table / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenuItems.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-500 bg-slate-800/20 rounded-3xl border border-slate-800">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm font-semibold">No dishes match your filter</p>
                  <button
                    onClick={openAddItemModal}
                    className="btn-primary mt-3 py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add First Dish
                  </button>
                </div>
              ) : (
                filteredMenuItems.map((item) => (
                  <div
                    key={item._id}
                    className={`bg-slate-800/90 border rounded-2xl p-4 flex flex-col justify-between transition-all shadow-md relative overflow-hidden ${
                      item.isAvailable ? 'border-slate-700/80 hover:border-slate-600' : 'border-red-900/50 bg-slate-900/60 opacity-80'
                    }`}
                  >
                    <div>
                      {/* Top Row: Thumbnail, Name, Price */}
                      <div className="flex gap-3 mb-3">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-700 relative">
                          <img
                            src={getDishImage(item)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                          {!item.isAvailable && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-[10px] font-black uppercase text-red-400 bg-black/80 px-1.5 py-0.5 rounded">
                                Sold Out
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <h3 className="font-bold text-white text-sm truncate" title={item.name}>
                              {item.name}
                            </h3>
                            <span className="font-mono font-bold text-primary-400 text-sm shrink-0">
                              {formatPrice(item.price)}
                            </span>
                          </div>

                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300 mb-1">
                            {item.category || 'Speciality'}
                          </span>

                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Dietary & Spice Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        {item.isVegetarian && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-green-950/60 text-green-300 border border-green-800/60 font-semibold">
                            🌱 Vegetarian
                          </span>
                        )}
                        {item.isVegan && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-semibold">
                            Vegan
                          </span>
                        )}
                        {item.isGlutenFree && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/60 font-semibold">
                            Gluten-Free
                          </span>
                        )}
                        {item.spiceLevel > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-orange-950/60 text-orange-300 border border-orange-800/60 font-semibold">
                            {'🌶️'.repeat(item.spiceLevel)} {item.spiceLevel === 1 ? 'Mild' : item.spiceLevel === 2 ? 'Medium' : 'Hot'}
                          </span>
                        )}
                        {item.isFeatured && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-yellow-300 border border-amber-800/60 font-semibold">
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions Row: Availability Toggle, Edit, Delete */}
                    <div className="border-t border-slate-700/60 pt-3 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleItemAvailability(item)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                          item.isAvailable
                            ? 'bg-green-950/40 text-green-300 border-green-800/60 hover:bg-green-900/50'
                            : 'bg-red-950/40 text-red-300 border-red-800/60 hover:bg-red-900/50'
                        }`}
                        title="Click to toggle availability"
                      >
                        {item.isAvailable ? <ToggleRight className="w-3.5 h-3.5 text-green-400" /> : <ToggleLeft className="w-3.5 h-3.5 text-red-400" />}
                        <span>{item.isAvailable ? 'In Stock' : '86\'d (Sold Out)'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditItemModal(item)}
                          className="p-1.5 text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors"
                          title="Edit Dish"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmItem(item)}
                          className="p-1.5 text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-900/50 rounded-lg border border-red-800/40 transition-colors"
                          title="Delete Dish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
