import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: 'RS Kerala Cafe | Authentic South Indian & Malabar Kitchen | Manchester',
  description: 'Order authentic Kerala & South Indian cuisine online for delivery or collection from RS Kerala Cafe Manchester. Traditional Thalassery Biriyani, crispy dosas, Porotta, and rich Malabar curries.',
  keywords: 'RS Kerala Cafe, Kerala food Manchester, South Indian delivery, Malabar biryani, dosa Manchester',
  openGraph: {
    title: 'RS Kerala Cafe Manchester',
    description: 'Authentic Malabar & Kerala culinary heritage delivered fresh to your door',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: { background: '#1a1a1a', color: '#fff', borderRadius: '12px', padding: '12px 16px' },
            success: { iconTheme: { primary: '#e85d04', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
