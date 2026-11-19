import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
    return Promise.reject(error)
  }
)

export const menuAPI = {
  getAll: (params?: Record<string, string>) => api.get('/menu', { params }),
  getCategories: () => api.get('/menu/categories'),
  getFeatured: () => api.get('/menu/featured'),
  getById: (id: string) => api.get(`/menu/${id}`),
}

export const orderAPI = {
  create: (data: unknown) => api.post('/orders', data),
  getMy: () => api.get('/orders/my'),
  getById: (id: string) => api.get(`/orders/${id}`),
  track: (id: string) => api.get(`/orders/${id}/track`),
}

export const paymentAPI = {
  createStripeIntent: (orderId: string) => api.post('/payments/stripe/create-intent', { orderId }),
  simulate: (orderId: string, paymentMethod = 'stripe') =>
    api.post('/payments/simulate', { orderId, paymentMethod }),
  capturePayPal: (orderId: string, paypalOrderId: string) =>
    api.post('/payments/paypal/capture', { orderId, paypalOrderId }),
  createGoCardlessMandate: (orderId: string) =>
    api.post('/payments/gocardless/create-mandate', { orderId }),
}

export const authAPI = {
  register: (data: unknown) => api.post('/auth/register', data),
  login: (data: unknown) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data: unknown) => api.put('/auth/profile', data),
  addAddress: (data: unknown) => api.post('/auth/addresses', data),
  deleteAddress: (id: string) => api.delete(`/auth/addresses/${id}`),
}

export const couponAPI = {
  validate: (code: string, orderTotal: number) =>
    api.post('/coupons/validate', { code, orderTotal }),
}

export default api
