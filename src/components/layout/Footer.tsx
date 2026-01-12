import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { UI_TEXT } from '@/lib/constants/uiText'
import { memo } from 'react'

const footerLinks = [
  { href: '/', label: UI_TEXT.footer.links.home },
  { href: '/berita', label: UI_TEXT.footer.links.news },
  { href: '/berita', label: UI_TEXT.footer.links.politics },
  { href: '/berita', label: UI_TEXT.footer.links.economy },
  { href: '/berita', label: UI_TEXT.footer.links.sports },
]

const currentYear = new Date().getFullYear()

function FooterComponent() {
  return (
    <footer className="bg-[hsl(var(--color-background-dark))] text-[hsl(var(--color-text-muted-dark))] mt-12" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <section aria-labelledby="footer-about-heading">
            <h2 id="footer-about-heading" className="sr-only">Tentang Mitra Banten News</h2>
            <div className="mb-4">
              <h3 className="text-xl font-bold mb-2">{UI_TEXT.footer.aboutTitle}</h3>
              <p className="text-[hsl(var(--color-text-muted-dark))] text-sm">
                {UI_TEXT.footer.aboutDescription}
              </p>
            </div>
          </section>

          <section aria-labelledby="footer-nav-heading">
            <h2 id="footer-nav-heading" className="text-lg font-semibold mb-4">{UI_TEXT.footer.navigation}</h2>
            <nav aria-label="Navigasi Footer">
                <ul className="space-y-2">
                  {footerLinks.map((link, index) => (
                    <li key={`${link.href}-${index}`}>
                      <Link
                        href={link.href}
                        className="text-[hsl(var(--color-text-muted-dark))] hover:text-[hsl(var(--color-surface))] transition-all duration-[var(--transition-fast)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 rounded-[var(--radius-sm)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
            </nav>
          </section>

          <section aria-labelledby="footer-contact-heading">
            <h2 id="footer-contact-heading" className="text-lg font-semibold mb-4">{UI_TEXT.footer.contactTitle}</h2>
            <address className="not-italic text-[hsl(var(--color-text-muted-dark))] text-sm space-y-2">
              <p>{UI_TEXT.footer.email}</p>
              <p>{UI_TEXT.footer.phone}</p>
              <p>{UI_TEXT.footer.address}</p>
            </address>
          </section>
        </div>

        <div className="border-t border-[hsl(var(--color-surface-dark))] pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-[hsl(var(--color-text-faint-dark))] text-center md:text-left" dangerouslySetInnerHTML={{ __html: UI_TEXT.footer.copyright(currentYear) }} />
            <div className="flex space-x-4">
              <a
                href="/"
                className="text-[hsl(var(--color-text-faint-dark))] hover:text-[hsl(var(--color-surface))] transition-all duration-[var(--transition-fast)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 rounded-[var(--radius-sm)]"
                aria-label="Facebook"
              >
                <Icon type="facebook" className="h-5 w-5" />
              </a>
              <a
                href="/"
                className="text-[hsl(var(--color-text-faint-dark))] hover:text-[hsl(var(--color-surface))] transition-all duration-[var(--transition-fast)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 rounded-[var(--radius-sm)]"
                aria-label="Twitter"
              >
                <Icon type="twitter" className="h-5 w-5" />
              </a>
              <a
                href="/"
                className="text-[hsl(var(--color-text-faint-dark))] hover:text-[hsl(var(--color-surface))] transition-all duration-[var(--transition-fast)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 rounded-[var(--radius-sm)]"
                aria-label="Instagram"
              >
                <Icon type="instagram" className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default memo(FooterComponent)
