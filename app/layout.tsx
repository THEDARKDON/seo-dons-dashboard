import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import { CallProvider } from '@/contexts/CallContext'
import { FloatingCallWidget } from '@/components/calling/floating-call-widget'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SEO Dons Sales Dashboard',
  description: 'Track deals, calls, and commissions for your sales team',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <CallProvider>
            {children}
            <FloatingCallWidget />
            <Toaster position="top-right" />
          </CallProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
