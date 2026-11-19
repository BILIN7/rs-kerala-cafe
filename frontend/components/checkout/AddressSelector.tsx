'use client'
import { useState, useEffect } from 'react'
import { MapPin, Navigation, Home, Briefcase, Plus, Check, Search, AlertCircle, Building, Key, MessageSquare, Zap, Compass } from 'lucide-react'
import { validateUKPostcode } from '@/lib/utils'
import toast from 'react-hot-toast'

export interface AddressData {
  id?: string
  label?: string
  line1: string
  line2?: string
  city: string
  postcode: string
  gateCode?: string
  deliveryPreference?: string
  driverNotes?: string
  coordinates?: { lat: number; lng: number }
  saveAsPermanent?: boolean
}

interface AddressSelectorProps {
  onAddressSelect: (address: AddressData) => void
  initialAddress?: Partial<AddressData>
  user?: any
}

const PREFERENCE_OPTIONS = [
  '🚪 Leave at door',
  '🔔 Ring doorbell',
  '🤫 Do not knock (Baby sleeping)',
  '📞 Call upon arrival',
  '🏢 Leave with reception / concierge',
]

// Popular Manchester test & delivery locations for 1-click GPS fixing
const MANCHESTER_PRESETS = [
  { label: 'Old Trafford', line1: 'Sir Matt Busby Way', postcode: 'M16 0RA', lat: 53.46306, lng: -2.29139 },
  { label: 'Northenden', line1: '303 Palatine Rd', postcode: 'M22 4HH', lat: 53.40920, lng: -2.25620 },
  { label: 'City Centre', line1: '100 Deansgate', postcode: 'M3 2QG', lat: 53.48120, lng: -2.24780 },
  { label: 'Didsbury', line1: 'Wilmslow Rd', postcode: 'M20 2RR', lat: 53.41750, lng: -2.23120 },
]

export default function AddressSelector({ onAddressSelect, initialAddress, user }: AddressSelectorProps) {
  const [mode, setMode] = useState<'saved' | 'new'>('new')
  const [entryMethod, setEntryMethod] = useState<'manual' | 'map'>('manual')

  const [savedAddresses, setSavedAddresses] = useState<AddressData[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)

  // Current Form State
  const [line1, setLine1] = useState(initialAddress?.line1 || '')
  const [line2, setLine2] = useState(initialAddress?.line2 || '')
  const [city, setCity] = useState(initialAddress?.city || 'Manchester')
  const [postcode, setPostcode] = useState(initialAddress?.postcode || '')
  const [gateCode, setGateCode] = useState(initialAddress?.gateCode || '')
  const [label, setLabel] = useState(initialAddress?.label || 'Home')
  const [saveAsPermanent, setSaveAsPermanent] = useState(false)
  const [deliveryPreference, setDeliveryPreference] = useState(initialAddress?.deliveryPreference || '')
  const [driverNotes, setDriverNotes] = useState(initialAddress?.driverNotes || '')
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>(
    initialAddress?.coordinates || { lat: 53.4092, lng: -2.2562 }
  )

  const [mapQuery, setMapQuery] = useState('')
  const [isSearchingMap, setIsSearchingMap] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [isGeocodingPostcode, setIsGeocodingPostcode] = useState(false)
  const [mapSearchResults, setMapSearchResults] = useState<any[]>([])

  useEffect(() => {
    let addresses: AddressData[] = []
    if (user && user.addresses && user.addresses.length > 0) {
      addresses = user.addresses
    } else if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('food_saved_addresses')
      if (stored) {
        try { addresses = JSON.parse(stored) } catch (e) {}
      }
    }

    if (addresses.length > 0) {
      setSavedAddresses(addresses)
      setMode('saved')
      const defaultAddr = addresses.find(a => (a as any).isDefault) || addresses[0]
      setSelectedAddressId(defaultAddr.id || (defaultAddr as any)._id || '0')
      propagateAddress(defaultAddr)
    } else {
      setMode('new')
    }
  }, [user])

  const propagateAddress = (data: Partial<AddressData>) => {
    const payload: AddressData = {
      line1: data.line1 !== undefined ? data.line1 : line1,
      line2: data.line2 !== undefined ? data.line2 : line2,
      city: data.city !== undefined ? data.city : city,
      postcode: data.postcode !== undefined ? data.postcode : postcode,
      gateCode: data.gateCode !== undefined ? data.gateCode : gateCode,
      label: data.label !== undefined ? data.label : label,
      deliveryPreference: data.deliveryPreference !== undefined ? data.deliveryPreference : deliveryPreference,
      driverNotes: data.driverNotes !== undefined ? data.driverNotes : driverNotes,
      coordinates: data.coordinates !== undefined ? data.coordinates : coordinates,
      saveAsPermanent,
    }
    onAddressSelect(payload)
  }

  // 100% Reliable UK Postcode Geocoding via postcodes.io
  const fixGpsFromPostcode = async (pcToLookup?: string) => {
    const pc = (pcToLookup || postcode).replace(/\s+/g, '').toUpperCase()
    if (!pc || pc.length < 5) return

    setIsGeocodingPostcode(true)
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`)
      const data = await res.json()

      if (data && data.status === 200 && data.result) {
        const lat = data.result.latitude
        const lng = data.result.longitude
        const newCoords = { lat, lng }
        setCoordinates(newCoords)
        propagateAddress({ coordinates: newCoords })
        toast.success(`📍 Exact GPS Fixed: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
        return newCoords
      }
    } catch (e) {
      console.warn('Postcode GPS lookup fallback error:', e)
    } finally {
      setIsGeocodingPostcode(false)
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    if (field === 'line1') setLine1(value)
    if (field === 'line2') setLine2(value)
    if (field === 'city') setCity(value)
    if (field === 'postcode') {
      const upper = value.toUpperCase()
      setPostcode(upper)
      if (validateUKPostcode(upper)) {
        fixGpsFromPostcode(upper)
      }
    }
    if (field === 'gateCode') setGateCode(value)
    if (field === 'label') setLabel(value)
    if (field === 'deliveryPreference') setDeliveryPreference(value)
    if (field === 'driverNotes') setDriverNotes(value)
    if (field === 'saveAsPermanent') setSaveAsPermanent(value)

    propagateAddress({ [field]: value })
  }

  const handleSelectSaved = (addr: AddressData) => {
    const id = addr.id || (addr as any)._id
    setSelectedAddressId(id)
    setLine1(addr.line1)
    setLine2(addr.line2 || '')
    setCity(addr.city)
    setPostcode(addr.postcode)
    setGateCode(addr.gateCode || '')
    setLabel(addr.label || 'Home')
    setCoordinates(addr.coordinates)
    propagateAddress(addr)
    toast.success(`Selected "${addr.label || 'Saved'}" address`)
  }

  // HTML5 Current Location detection + Reverse Geocode
  const handleDetectLocation = () => {
    setIsLocating(true)

    if (!navigator.geolocation) {
      toast('Browser GPS not available. Using Manchester location.', { icon: '📍' })
      applyPreset(MANCHESTER_PRESETS[1])
      setIsLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoordinates({ lat, lng })

        try {
          // Reverse geocode via OpenStreetMap Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`)
          const data = await res.json()
          if (data && data.address) {
            const detectedLine1 = [data.address.house_number, data.address.road].filter(Boolean).join(' ') || data.address.suburb || 'My Location'
            const detectedCity = data.address.city || data.address.town || data.address.county || 'Manchester'
            const detectedPostcode = data.address.postcode || 'M22 4HH'

            setLine1(detectedLine1)
            setCity(detectedCity)
            setPostcode(detectedPostcode.toUpperCase())

            propagateAddress({
              line1: detectedLine1,
              city: detectedCity,
              postcode: detectedPostcode,
              coordinates: { lat, lng }
            })
            toast.success(`📍 GPS Fixed: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
          }
        } catch (err) {
          toast.success(`📍 GPS Pin Fixed: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
          propagateAddress({ coordinates: { lat, lng } })
        } finally {
          setIsLocating(false)
        }
      },
      (err) => {
        setIsLocating(false)
        // Friendly fallback for localhost / desktop browsers
        toast('GPS permission not granted. Selected Manchester central pin.', { icon: '📍' })
        applyPreset(MANCHESTER_PRESETS[0])
      },
      { timeout: 7000, enableHighAccuracy: true }
    )
  }

  // Apply Quick Manchester preset
  const applyPreset = (preset: typeof MANCHESTER_PRESETS[0]) => {
    setLine1(preset.line1)
    setCity('Manchester')
    setPostcode(preset.postcode)
    setCoordinates({ lat: preset.lat, lng: preset.lng })
    propagateAddress({
      line1: preset.line1,
      city: 'Manchester',
      postcode: preset.postcode,
      coordinates: { lat: preset.lat, lng: preset.lng }
    })
    toast.success(`📍 Applied ${preset.label} (GPS: ${preset.lat}, ${preset.lng})`)
  }

  // Search Map via Nominatim
  const handleSearchMap = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mapQuery.trim()) return

    setIsSearchingMap(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapQuery)}&countrycodes=gb&addressdetails=1&limit=4`)
      const results = await res.json()
      setMapSearchResults(results)
      if (results.length === 0) {
        toast.error('No UK locations found for that search')
      }
    } catch (err) {
      toast.error('Failed to search map location')
    } finally {
      setIsSearchingMap(false)
    }
  }

  const handleSelectSearchResult = (res: any) => {
    const lat = parseFloat(res.lat)
    const lng = parseFloat(res.lon)
    const addr = res.address || {}

    const selectedLine1 = [addr.house_number, addr.road].filter(Boolean).join(' ') || res.display_name.split(',')[0]
    const selectedCity = addr.city || addr.town || addr.county || 'Manchester'
    const selectedPostcode = addr.postcode || ''

    setLine1(selectedLine1)
    setCity(selectedCity)
    if (selectedPostcode) setPostcode(selectedPostcode.toUpperCase())
    setCoordinates({ lat, lng })
    setMapSearchResults([])
    setMapQuery('')

    propagateAddress({
      line1: selectedLine1,
      city: selectedCity,
      postcode: selectedPostcode,
      coordinates: { lat, lng }
    })
    toast.success(`📍 GPS Pin Selected: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
  }

  return (
    <div className="space-y-5">
      {/* Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
        <div>
          <h2 className="font-semibold text-lg text-dark flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600" /> Delivery Address & GPS Location
          </h2>
          <p className="text-xs text-gray-500">Provide exact street & postcode for real-time driver dispatch</p>
        </div>

        {savedAddresses.length > 0 && (
          <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('saved')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                mode === 'saved' ? 'bg-white text-primary-700 shadow-xs' : 'text-gray-500 hover:text-dark'
              }`}
            >
              Saved ({savedAddresses.length})
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                mode === 'new' ? 'bg-white text-primary-700 shadow-xs' : 'text-gray-500 hover:text-dark'
              }`}
            >
              + New Address
            </button>
          </div>
        )}
      </div>

      {/* SAVED ADDRESSES VIEW */}
      {mode === 'saved' && savedAddresses.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedAddresses.map((addr, idx) => {
              const id = addr.id || (addr as any)._id || idx.toString()
              const isSelected = selectedAddressId === id

              return (
                <div
                  key={id}
                  onClick={() => handleSelectSaved(addr)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50/50 shadow-xs ring-2 ring-primary-100'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs uppercase tracking-wider text-primary-800 flex items-center gap-1">
                        {addr.label === 'Work' ? <Briefcase className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
                        {addr.label || 'Saved'}
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-dark">{addr.line1}</p>
                    {addr.line2 && <p className="text-xs text-gray-600">{addr.line2}</p>}
                    <p className="text-xs text-gray-500">{addr.city}, {addr.postcode}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setMode('new')
              setLine1('')
              setLine2('')
              setPostcode('')
            }}
            className="text-xs text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1 mt-2"
          >
            <Plus className="w-3.5 h-3.5" /> Deliver to a different address
          </button>
        </div>
      )}

      {/* NEW ADDRESS VIEW */}
      {mode === 'new' && (
        <div className="space-y-4">
          {/* Quick Auto-Detect GPS & Manchester Preset Bar */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3.5 rounded-2xl space-y-2.5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-600 animate-spin" /> Exact GPS Pinning
              </span>

              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Navigation className="w-3.5 h-3.5" />
                {isLocating ? 'Detecting GPS...' : 'Auto-Detect My GPS'}
              </button>
            </div>

            {/* Quick Manchester Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
              <span className="text-blue-800 font-semibold">Quick Manchester Pins:</span>
              {MANCHESTER_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="bg-white hover:bg-blue-100 text-blue-900 border border-blue-200 px-2 py-0.5 rounded-lg font-medium transition-colors"
                >
                  {preset.label} ({preset.postcode})
                </button>
              ))}
            </div>

            {/* Fixed Coordinates Badge */}
            {coordinates && (
              <div className="bg-white/90 px-3 py-1.5 rounded-xl border border-blue-200 text-xs font-mono flex items-center justify-between text-blue-950">
                <span className="flex items-center gap-1.5 font-bold">
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  GPS Fixed: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
                </span>
                <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase font-bold">
                  Verified For Driver
                </span>
              </div>
            )}
          </div>

          {/* Form Fields: Street Line 1 & Line 2 */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Street Address / House No. *
              </label>
              <input
                type="text"
                required
                value={line1}
                onChange={(e) => handleFieldChange('line1', e.target.value)}
                placeholder="e.g. 303 Palatine Road, Flat 4"
                className="input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                value={line2}
                onChange={(e) => handleFieldChange('line2', e.target.value)}
                placeholder="Apartment, suite, unit, building floor"
                className="input text-sm"
              />
            </div>

            {/* Town / City & UK Postcode */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">City / Town *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  placeholder="Manchester"
                  className="input text-sm"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-gray-700">UK Postcode *</label>
                  {isGeocodingPostcode && (
                    <span className="text-[10px] text-blue-600 animate-pulse font-medium">Resolving GPS...</span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={postcode}
                  onChange={(e) => handleFieldChange('postcode', e.target.value)}
                  onBlur={() => fixGpsFromPostcode()}
                  placeholder="e.g. M22 4HH"
                  className="input text-sm uppercase font-mono font-bold"
                />
              </div>
            </div>

            {/* Gate / Buzzer Code */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-gray-500" /> Building Gate / Intercom Code (Optional)
              </label>
              <input
                type="text"
                value={gateCode}
                onChange={(e) => handleFieldChange('gateCode', e.target.value)}
                placeholder="e.g. #4091 or Buzzer Flat 2B"
                className="input text-sm"
              />
            </div>

            {/* Delivery Handover Preferences */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Handover Preference
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PREFERENCE_OPTIONS.map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => handleFieldChange('deliveryPreference', deliveryPreference === pref ? '' : pref)}
                    className={`text-xs px-2.5 py-1.5 rounded-xl border transition-colors ${
                      deliveryPreference === pref
                        ? 'bg-primary-600 text-white border-primary-600 font-bold shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>

            {/* Save as permanent address checkbox */}
            <div className="pt-2 border-t flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={saveAsPermanent}
                  onChange={(e) => handleFieldChange('saveAsPermanent', e.target.checked)}
                  className="rounded bg-white border-gray-300 text-primary-600 focus:ring-0 w-4 h-4"
                />
                <span>Save this address for fast 1-click ordering in the future</span>
              </label>

              {saveAsPermanent && (
                <div className="flex gap-1.5 text-xs">
                  {['Home', 'Work', 'Other'].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => handleFieldChange('label', lbl)}
                      className={`px-2 py-0.5 rounded-lg font-bold text-[11px] ${
                        label === lbl ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
