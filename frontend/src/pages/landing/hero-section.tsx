
export function HeroSection({ onOpenAuth }: { onOpenAuth: () => void }) {
  return (
    <section>
      {/* Hero content — edge-to-edge full width */}
      <div className="w-full">
        <div className="grid md:grid-cols-[1fr_1px_1fr] items-stretch border-b border-divider">
          {/* Left — headline */}
          <div className="relative flex flex-col justify-center overflow-hidden bg-ink">
            <video
              src="/videos/vid2.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
            
            <div className="relative z-10 w-full max-w-[40rem] ml-auto px-6 md:px-10 lg:pr-16 py-16 md:py-24 lg:py-36">
              <p className="eyebrow mb-8 text-white/80">For couples who care</p>
              <h1 className="font-serif font-light text-5xl md:text-[3.5rem] lg:text-[4rem] xl:text-[4.5rem] leading-[1.08] text-white drop-shadow-md">
                Make dates{' '}
                <em className="not-italic font-serif italic text-white/90">memorable</em>
              </h1>
            </div>
          </div>

          {/* Vertical divider */}
          <div className="hidden md:block bg-divider" />

          {/* Right — description + CTA */}
          <div className="flex flex-col justify-center bg-cream">
            <div className="w-full max-w-[40rem] mr-auto px-6 md:px-10 lg:pl-16 py-16 md:py-28 lg:py-36">
              <p className="body-text max-w-sm text-ink-muted">
                Capture your most precious moments, plan unforgettable dates, and build deeper
                connections with the person you love.
              </p>
              <p className="font-mono text-[0.76rem] font-medium text-ink-muted/60 mt-3 mb-10">
                Your relationship deserves something beautiful.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={onOpenAuth}
                  className="btn-primary group relative overflow-hidden"
                >
                  <video
                    src="/videos/vid1.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"
                  />
                  <span className="relative z-10 block">Start Your Story</span>
                </button>
                <a href="#features" className="btn-outline">
                  See How It Works
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row — FULL-BLEED horizontal line */}
      <div className="full-bleed-divider">
        <div className="landing-container">
          <div className="grid grid-cols-3">
            {[
              { number: '12K+', label: 'Couples joined' },
              { number: '98%', label: 'Happier together' },
              { number: '∞', label: 'Memories captured' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`py-10 md:py-14 text-center ${i < 2 ? 'border-r border-divider' : ''}`}
              >
                <p className="font-serif font-light text-3xl md:text-[2.5rem] text-ink leading-none">
                  {stat.number}
                </p>
                <p className="eyebrow mt-3">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
