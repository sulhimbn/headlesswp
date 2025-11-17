import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ClientLayout from '@/components/ClientLayout'
// import { GraphQLProvider } from '@/components/GraphQLProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://mitrabantennews.com'),
  title: 'Mitra Banten News - Berita Terkini Banten',
  description: 'Portal berita terkini dan terpercaya dari Banten',
  keywords: 'berita banten, mitra banten news, berita terkini',
  openGraph: {
    title: 'Mitra Banten News',
    description: 'Portal berita terkini dan terpercaya dari Banten',
    url: 'https://mitrabantennews.com',
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
      </head>
      <body className={inter.className}>
        {/* <GraphQLProvider> */}
          <ClientLayout>
            {children}
          </ClientLayout>
        {/* </GraphQLProvider> */}
      </body>
    </html>
  )
}