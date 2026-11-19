'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { ChefHat, ArrowLeft } from 'lucide-react'
import Logo from '@/components/ui/Logo'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .min(10, 'Please enter a valid UK phone number')
    .refine(
      (val) => {
        const cleaned = val.replace(/\s+/g, '')
        return /^(\+44|0)[0-9]{10}$/.test(cleaned)
      },
      { message: 'Valid UK phone number required (e.g., 07123 456789 or 07123456789)' }
    ),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  marketingOptIn: z.boolean().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    try {
      const { confirmPassword, ...payload } = data
      if (payload.phone) {
        payload.phone = payload.phone.replace(/\s+/g, '')
      }
      const res = await authAPI.register(payload)
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', res.data.token)
        localStorage.setItem('user_info', JSON.stringify(res.data.user))
        window.dispatchEvent(new Event('storage'))
      }
      toast.success('Account created successfully! Welcome to RS Kerala Cafe.')
      router.push('/account')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-600 mb-6 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Store
        </Link>
        <div className="flex justify-center mb-3">
          <Logo size="md" variant="light" />
        </div>
        <h2 className="text-center text-2xl font-display font-bold text-dark">Create Account</h2>
        <p className="mt-1 text-center text-sm text-gray-500">
          Join RS Kerala Cafe for fast checkout and exclusive offers
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="card p-8 bg-white">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Full Name</label>
              <input
                {...register('name')}
                placeholder="John Smith"
                className="input"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-1">Email address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="name@example.co.uk"
                className="input"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-1">UK Phone Number</label>
              <input
                {...register('phone')}
                placeholder="07123456789"
                className="input"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-1">Password</label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="input"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-1">Confirm Password</label>
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className="input"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                {...register('marketingOptIn')}
                type="checkbox"
                id="optin"
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="optin" className="text-xs text-gray-600 cursor-pointer">
                Receive special discounts and weekly chef specials via email
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 text-sm font-semibold mt-4"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 hover:underline font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
