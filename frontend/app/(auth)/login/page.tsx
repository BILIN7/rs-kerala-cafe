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

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await authAPI.login(data)
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', res.data.token)
        localStorage.setItem('user_info', JSON.stringify(res.data.user))
        window.dispatchEvent(new Event('storage'))
      }
      toast.success('Welcome back!')
      if (res.data.user?.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/account')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid email or password')
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
        <h2 className="text-center text-2xl font-display font-bold text-dark">Sign In</h2>
        <p className="mt-1 text-center text-sm text-gray-500">
          Sign in to track orders, save delivery addresses & view history
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="card p-8 bg-white">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
              <label className="block text-sm font-medium text-dark mb-1">Password</label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="input"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 text-sm font-semibold mt-2"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            Don't have an account yet?{' '}
            <Link href="/register" className="text-primary-600 hover:underline font-semibold">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
