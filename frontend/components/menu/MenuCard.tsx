'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Plus, Leaf, Clock } from 'lucide-react'
import { useCartStore } from '@/lib/store/cartStore'
import { formatPrice, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface MenuItem {
  _id: string
  name: string
  description: string
  price: number
  image?: string
  isVegetarian: boolean
  isVegan: boolean
  isSpicy: boolean
  spiceLevel: number
  isGlutenFree: boolean
  allergens?: { name: string; contains: boolean }[]
  options?: unknown[]
  category: string
}

export default function MenuCard({ item }: { item: MenuItem }) {
  const { addItem } = useCartStore()
  const [adding, setAdding] = useState(false)

  const handleAdd = () => {
    setAdding(true)
    addItem({
      menuItemId: item._id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
      itemTotal: item.price,
    })
    toast.success(`${item.name} added to cart!`)
    setTimeout(() => setAdding(false), 600)
  }

  return (
    <div className="card group hover:shadow-md transition-all duration-300">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🍛</div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {item.isVegetarian && (
            <span className="badge-veg">
              <Leaf className="w-3 h-3" /> Veg
            </span>
          )}
          {item.isGlutenFree && (
            <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
              GF
            </span>
          )}
        </div>
        {item.isSpicy && item.spiceLevel > 0 && (
          <div className="absolute top-2 right-2 badge-spicy">
            {'🌶️'.repeat(Math.min(item.spiceLevel, 3))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-semibold text-dark leading-tight">{item.name}</h3>
          <span className="text-primary-600 font-bold whitespace-nowrap">{formatPrice(item.price)}</span>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed mb-3 line-clamp-2">{item.description}</p>

        {/* Allergens */}
        {item.allergens && item.allergens.filter((a) => a.contains).length > 0 && (
          <p className="text-xs text-gray-400 mb-2">
            Contains: {item.allergens.filter((a) => a.contains).map((a) => a.name).join(', ')}
          </p>
        )}

        {/* Estimated Cooking Time Badge */}
        <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-lg mb-3 w-fit font-medium">
          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          <span>Freshly cooked: ~15-20 mins</span>
        </div>

        <button
          onClick={handleAdd}
          className={cn(
            'btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5',
            adding && 'scale-95 bg-green-600 hover:bg-green-600'
          )}
        >
          <Plus className="w-4 h-4" />
          {adding ? 'Added! ✓' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
