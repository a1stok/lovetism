import { useState } from 'react'
import { Logo } from '@/components/brand'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { name: 'Features', href: '#features' },
  { name: 'About', href: '#about' },
]

export function LandingNavbar({ onOpenAuth }: { onOpenAuth: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-[var(--cream)]/95 backdrop-blur">
      <div className="border-b border-divider">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="flex h-14 items-center justify-between">
            {/* Logo — serif italic */}
            <a href="/" className="flex items-center"><Logo variant="light" size="navbar" /></a>

            {/* Desktop nav — mono uppercase */}
            <nav className="hidden md:flex items-center gap-10">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-[0.72rem] font-mono font-medium uppercase tracking-editorial text-ink-muted hover:text-ink transition-colors duration-200"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* CTA */}
            <div className="hidden md:block">
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center justify-center px-5 py-2 text-[0.72rem] font-mono font-medium uppercase tracking-editorial bg-mauve text-white rounded-sm hover:bg-dusty-rose transition-colors duration-200"
              >
                Get Started
              </button>
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 text-ink-muted hover:text-ink"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'md:hidden absolute top-full left-0 right-0 bg-[var(--cream)] border-b border-divider transition-all duration-200',
          mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none',
        )}
      >
        <nav className="flex flex-col px-6 py-5 gap-5">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-[0.76rem] font-mono font-medium uppercase tracking-editorial text-ink-muted hover:text-ink transition-colors"
            >
              {link.name}
            </a>
          ))}
          <button
            onClick={onOpenAuth}
            className="inline-flex items-center justify-center px-5 py-2.5 text-[0.72rem] font-mono font-medium uppercase tracking-editorial bg-mauve text-white rounded-sm hover:bg-dusty-rose transition-colors w-full"
          >
            Get Started
          </button>
        </nav>
      </div>
    </header>
  )
}
