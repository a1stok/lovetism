import { ArrowRight } from 'lucide-react'

export function DownloadSection({ onOpenAuth }: { onOpenAuth: () => void }) {
  return (
    <section>
      {/* Full-bleed top line */}
      <div className="full-bleed-divider">
        <div className="landing-container">
          <div className="grid md:grid-cols-[1fr_1px_1fr] items-stretch">
            {/* Left — headline */}
            <div className="flex flex-col justify-center py-20 md:py-28 md:pr-16">
              <p className="eyebrow mb-6">Ready?</p>
              <h2 className="font-serif font-light text-3xl md:text-4xl lg:text-5xl leading-tight text-ink">
                Take <em className="italic text-mauve">Lovetism</em>
                <br />
                with you
              </h2>
            </div>

            {/* Vertical divider */}
            <div className="hidden md:block bg-divider" />

            {/* Right — description + action */}
            <div className="flex flex-col justify-center py-20 md:py-28 md:pl-16 border-t md:border-t-0 border-divider">
              <p className="body-text max-w-sm mb-10">
                Plan dates, save memories, and stay connected — your relationship companion,
                wherever you are.
              </p>
              <button
                onClick={onOpenAuth}
                className="btn-primary group w-fit flex items-center gap-3"
              >
                Start for Free
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
