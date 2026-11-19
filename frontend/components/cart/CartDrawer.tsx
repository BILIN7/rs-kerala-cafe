'use client'
import { useCartStore } from '@/lib/store/cartStore'
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    subtotal,
    deliveryFee,
    discount,
    total,
    fulfillmentType,
    itemCount,
  } = useCartStore()

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 cart-overlay" onClick={closeCart} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-white shadow-2xl animate-slide-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary-600" />
            <h2 className="font-display font-bold text-xl">Your Cart</h2>
            {itemCount > 0 && (
              <span className="bg-primary-100 text-primary-700 text-sm font-semibold px-2 py-0.5 rounded-full">
                {itemCount}
              </span>
            )}
          </div>
          <button onClick={closeCart} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fulfillment type toggle */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(['delivery', 'collection'] as const).map((type) => (
              <button
                key={type}
                onClick={() => useCartStore.getState().setFulfillmentType(type)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${
                  fulfillmentType === type
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {type === 'delivery' ? '🚚 Delivery' : '🏃 Collection'}
              </button>
            ))}
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 text-primary-300" />
              </div>
              <h3 className="font-semibold text-dark mb-2">Your cart is empty</h3>
              <p className="text-sm text-gray-500 mb-4">Add some delicious items from our menu!</p>
              <button onClick={closeCart} className="btn-primary text-sm">
                Browse Menu
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                {item.image && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 relative">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-dark truncate">{item.name}</h4>
                  {item.selectedOptions?.map((opt) => (
                    <p key={opt.groupName} className="text-xs text-gray-500">
                      {opt.groupName}: {opt.selectedItems.map((i) => i.name).join(', ')}
                    </p>
                  ))}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-primary-600 font-bold text-sm">{formatPrice(item.itemTotal)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-primary-400 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-semibold text-sm w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-4 space-y-3 bg-white">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>
                  Delivery{' '}
                  {deliveryFee === 0 && fulfillmentType === 'delivery'
                    ? '(Free! 🎉)'
                    : fulfillmentType === 'collection'
                    ? '(Collection)'
                    : ''}
                </span>
                <span>{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-dark text-base pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-primary-600">{formatPrice(total)}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="btn-primary w-full flex items-center justify-center gap-2 text-center"
            >
              Checkout <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-center text-gray-400">
              Free delivery on orders over £30 · Secure checkout
            </p>
          </div>
        )}
      </div>
    </>
  )
}
