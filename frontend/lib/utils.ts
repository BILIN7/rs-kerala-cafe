import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatPrice = (pence: number): string => {
  return `£${(pence / 100).toFixed(2)}`
}

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  }).format(new Date(date))
}

export const validateUKPostcode = (postcode: string): boolean => {
  const regex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i
  return regex.test(postcode.trim())
}

export const validateUKPhone = (phone: string): boolean => {
  const regex = /^(\+44|0)[0-9]{10}$/
  return regex.test(phone.replace(/\s/g, ''))
}

export const ORDER_STATUSES = {
  pending: { label: 'Order Placed', color: 'yellow', icon: '🕐', step: 0 },
  confirmed: { label: 'Confirmed', color: 'blue', icon: '✅', step: 1 },
  preparing: { label: 'Preparing', color: 'orange', icon: '👨‍🍳', step: 2 },
  ready: { label: 'Ready', color: 'green', icon: '🍽️', step: 3 },
  out_for_delivery: { label: 'Out for Delivery', color: 'purple', icon: '🚚', step: 4 },
  delivered: { label: 'Delivered', color: 'green', icon: '🎉', step: 5 },
  collected: { label: 'Collected', color: 'green', icon: '🎉', step: 5 },
  cancelled: { label: 'Cancelled', color: 'red', icon: '❌', step: -1 },
} as const
