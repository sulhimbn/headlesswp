import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    {
      title: 'Berita',
      links: [
        { name: 'Terkini', href: '/berita' },
        { name: 'Politik', href: '/politik' },
        { name: 'Ekonomi', href: '/ekonomi' },
        { name: 'Olahraga', href: '/olahraga' },
      ]
    },
    {
      title: 'Tentang',
      links: [
        { name: 'Redaksi', href: '/tentang/redaksi' },
        { name: 'Kontak', href: '/tentang/kontak' },
        { name: 'Karir', href: '/tentang/karir' },
      ]
    },
    {
      title: 'Layanan',
      links: [
        { name: 'RSS', href: '/rss' },
        { name: 'Newsletter', href: '/newsletter' },
        { name: 'Iklan', href: '/iklan' },
      ]
    }
  ]

  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-2xl font-bold text-red-500 mb-4">
              Mitra Banten News
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Portal berita terpercaya untuk masyarakat Banten. Menyajikan informasi aktual, akurat, dan berkualitas.
            </p>
          </div>

          {/* Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-lg font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white text-sm transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} Mitra Banten News. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
              <Link href="/disclaimer" className="text-gray-400 hover:text-white text-sm transition-colors">
                Disclaimer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}