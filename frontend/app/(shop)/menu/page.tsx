'use client'
import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { menuAPI } from '@/lib/api'
import MenuCard from '@/components/menu/MenuCard'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'

export default function MenuPage() {
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ veg: false, spicy: false, gf: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([menuAPI.getAll(), menuAPI.getCategories()]).then(([menuRes, catRes]) => {
      setItems(menuRes.data.items || [])
      setCategories(['All', ...(catRes.data.categories || [])])
      setLoading(false)
    })
  }, [])

  const filtered = items.filter((item) => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase())
    const matchVeg = !filters.veg || item.isVegetarian
    const matchSpicy = !filters.spicy || item.isSpicy
    const matchGF = !filters.gf || item.isGlutenFree
    return matchCat && matchSearch && matchVeg && matchSpicy && matchGF
  })

  const grouped = filtered.reduce((acc: Record<string, any[]>, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  return (
    <>
      <Navbar />
      <CartDrawer />
      <main className="min-h-screen">
        {/* Menu Hero */}
        <div className="bg-dark py-12 text-center">
          <h1 className="font-display text-4xl font-bold text-white mb-2">Our Menu</h1>
          <p className="text-gray-400">Fresh, authentic Indian cuisine made to order</p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search dishes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-12"
              />
            </div>
            <div className="flex gap-2">
              {[
                ['veg', '🌿 Veg'],
                ['spicy', '🌶️ Spicy'],
                ['gf', 'GF'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilters((f) => ({ ...f, [key]: !f[key as keyof typeof f] }))}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    filters[key as keyof typeof filters]
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-600 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card animate-pulse h-80 bg-gray-100" />
              ))}
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="font-display text-xl font-bold text-dark mb-2">No items found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, categoryItems]) => (
              <div key={category} className="mb-10">
                <h2 className="font-display text-2xl font-bold text-dark mb-5 pb-2 border-b-2 border-primary-100">
                  {category}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categoryItems.map((item) => (
                    <MenuCard key={item._id} item={item} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
