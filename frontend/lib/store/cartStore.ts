import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  menuItemId: string
  name: string
  price: number // pence
  quantity: number
  image?: string
  selectedOptions?: { groupName: string; selectedItems: { name: string; priceModifier: number }[] }[]
  itemTotal: number
}

interface CartStore {
  items: CartItem[]
  fulfillmentType: 'delivery' | 'collection'
  couponCode: string
  discount: number
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  setFulfillmentType: (type: 'delivery' | 'collection') => void
  setCoupon: (code: string, discount: number) => void
  removeCoupon: () => void
  openCart: () => void
  closeCart: () => void
  get subtotal(): number
  get deliveryFee(): number
  get total(): number
  get itemCount(): number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      fulfillmentType: 'delivery',
      couponCode: '',
      discount: 0,
      isOpen: false,

      addItem: (item) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            i =>
              i.menuItemId === item.menuItemId &&
              JSON.stringify(i.selectedOptions) === JSON.stringify(item.selectedOptions)
          )
          if (existingIndex >= 0) {
            const newItems = [...state.items]
            newItems[existingIndex].quantity += item.quantity
            newItems[existingIndex].itemTotal =
              newItems[existingIndex].price * newItems[existingIndex].quantity
            return { items: newItems, isOpen: true }
          }
          const newItem: CartItem = { ...item, id: `${item.menuItemId}-${Date.now()}` }
          return { items: [...state.items, newItem], isOpen: true }
        })
      },

      removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        set((state) => ({
          items: state.items.map(i =>
            i.id === id ? { ...i, quantity, itemTotal: i.price * quantity } : i
          ),
        }))
      },

      clearCart: () => set({ items: [], couponCode: '', discount: 0 }),
      setFulfillmentType: (type) => set({ fulfillmentType: type }),
      setCoupon: (code, discount) => set({ couponCode: code, discount }),
      removeCoupon: () => set({ couponCode: '', discount: 0 }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      get subtotal() {
        return get().items.reduce((s, i) => s + i.itemTotal, 0)
      },
      get deliveryFee() {
        const sub = get().subtotal
        if (get().fulfillmentType === 'collection') return 0
        return sub >= 3000 ? 0 : 199
      },
      get total() {
        return get().subtotal + get().deliveryFee - get().discount
      },
      get itemCount() {
        return get().items.reduce((s, i) => s + i.quantity, 0)
      },
    }),
    { name: 'cart-storage' }
  )
)
