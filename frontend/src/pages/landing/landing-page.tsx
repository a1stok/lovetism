import { LandingNavbar } from '@/components/landing/landing-navbar'
import { HeroSection } from './hero-section'
import { FeaturesSection } from './features-section'
import { DownloadSection } from './download-section'
import { AuthModal } from '@/features/auth'
import { useAuth } from '@/features/auth/context/use-auth'
import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

function Footer() {
// ... footer remains the same ...
  const currentYear = new Date().getFullYear()

  return (
    <footer className="landing-footer relative overflow-hidden">
      {/* Video Background */}
      <video
        src="/videos/vid1.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none mix-blend-luminosity"
      />

      {/* Footer grid */}
      <div className="relative z-10 border-t border-white/10">
        <div className="landing-container">
          <div className="grid sm:grid-cols-2 md:grid-cols-[1.2fr_1px_1fr_1px_1fr_1px_1fr]">
            {/* Brand */}
            <div className="py-12 md:py-16 md:pr-10">
              <p className="font-serif text-lg italic text-white/90 mb-3">Lovetism</p>
              <p className="font-mono text-[0.72rem] text-white/40 leading-relaxed font-medium">
                Making relationships beautiful, one date at a time.
              </p>
            </div>

            <div className="hidden md:block bg-white/10" />

            {/* Product */}
            <div className="py-12 md:py-16 md:px-10 border-t sm:border-t-0 border-white/10">
              <p className="footer-eyebrow mb-5">Product</p>
              <ul className="space-y-3">
                {['Features', 'Download'].map((item) => (
                  <li key={item}>
                    <a
                      href={`#${item.toLowerCase()}`}
                      className="font-mono text-[0.76rem] text-white/40 hover:text-white/80 transition-colors font-medium"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden md:block bg-white/10" />

            {/* Company */}
            <div className="py-12 md:py-16 md:px-10 border-t md:border-t-0 border-white/10">
              <p className="footer-eyebrow mb-5">Company</p>
              <ul className="space-y-3">
                {['About', 'Blog', 'Careers'].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="font-mono text-[0.76rem] text-white/40 hover:text-white/80 transition-colors font-medium"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden md:block bg-white/10" />

            {/* Legal */}
            <div className="py-12 md:py-16 md:pl-10 border-t md:border-t-0 border-white/10">
              <p className="footer-eyebrow mb-5">Legal</p>
              <ul className="space-y-3">
                {['Privacy', 'Terms', 'Cookies'].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="font-mono text-[0.76rem] text-white/40 hover:text-white/80 transition-colors font-medium"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 border-t border-white/10">
        <div className="landing-container py-8 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="font-mono text-[0.66rem] text-white/25 font-medium">
            © {currentYear} Lovetism. All rights reserved.
          </p>
          <p className="font-mono text-[0.66rem] text-white/25 font-medium">
            Made with love, for love.
          </p>
        </div>
      </div>
    </footer>
  )
}

export function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'register'>('login')
  const [pendingRedirect, setPendingRedirect] = useState(false)
  const { session } = useAuth()
  const navigate = useNavigate()

  // Safely auto-redirect when session populates after login/register
  useEffect(() => {
    if (session && pendingRedirect) {
      setPendingRedirect(false)
      void navigate({ to: '/journal' })
    }
  }, [session, pendingRedirect, navigate])

  // We no longer force-redirect logged-in users away from the home page on initial load.
  // This allows them to read the landing page if they explicitly click "Home".

  const openAuth = (tab: 'login' | 'register' = 'login') => {
    if (session) {
      // Use smooth SPA redirect instead of hard reload
      void navigate({ to: '/journal' })
      return
    }
    setAuthDefaultTab(tab)
    setIsAuthModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <LandingNavbar onOpenAuth={() => openAuth('login')} />
      <main>
        <HeroSection onOpenAuth={() => openAuth('register')} />
        <FeaturesSection />
        <DownloadSection onOpenAuth={() => openAuth('register')} />
      </main>
      <Footer />
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => setPendingRedirect(true)}
        defaultTab={authDefaultTab}
      />
    </div>
  )
}
