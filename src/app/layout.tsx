import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ClientLayout from '@/components/ClientLayout'
import { SITE_URL, SITE_URL_WWW } from '@/lib/api/config'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Mitra Banten News - Berita Terkini Banten',
  description: 'Portal berita terkini dan terpercaya dari Banten',
  keywords: 'berita banten, mitra banten news, berita terkini',
  openGraph: {
    title: 'Mitra Banten News',
    description: 'Portal berita terkini dan terpercaya dari Banten',
    url: SITE_URL,
    siteName: 'Mitra Banten News',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <meta name="csp-nonce" content="" />
        <link rel="preconnect" href={SITE_URL} />
        <link rel="preconnect" href={SITE_URL_WWW} />
        <link rel="dns-prefetch" href={SITE_URL} />
        <link rel="dns-prefetch" href={SITE_URL_WWW} />
      </head>
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[hsl(var(--color-primary))] focus:text-white focus:rounded-[var(--radius-md)] focus:shadow-[var(--shadow-lg)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 transition-all duration-[var(--transition-normal)]"
        >
          Langsung ke konten utama
        </a>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}