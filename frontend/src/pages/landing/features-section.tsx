interface Feature {
  image: string
  eyebrow: string
  title: string
  description: string
}

const features: Feature[] = [
  {
    image: '/images/landing/01-date-ideas.svg',
    eyebrow: '01',
    title: 'Date Ideas',
    description:
      'Personalized suggestions for dates, surprises, and special moments — tailored to you.',
  },
  {
    image: '/images/landing/02-journal.svg',
    eyebrow: '02',
    title: 'Memories Journal',
    description:
      'Capture memories and milestones in a beautiful private space that grows with you.',
  },
  {
    image: '/images/landing/03-couple-profiles.svg',
    eyebrow: '03',
    title: 'Couple Profiles',
    description:
      'Celebrate your unique love story and connect with a community of loving couples.',
  },
]

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  return (
    <div
      className={`feature-card group h-full flex flex-col ${
        index > 0 ? 'border-t md:border-t-0 md:border-l border-divider' : ''
      }`}
    >
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-[#FBF8F5] flex items-center justify-center p-10">
        <img
          src={feature.image}
          alt={feature.title}
          className="w-full max-w-[160px] h-auto transition-transform duration-700 group-hover:scale-110"
        />
      </div>

      {/* Text */}
      <div className="p-6 md:p-8 flex flex-col flex-1 justify-center">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ink-muted/50">
            {feature.eyebrow}
          </span>
        </div>
        <h3 className="font-serif font-normal text-xl md:text-2xl text-ink mb-3">
          {feature.title}
        </h3>
        <p className="font-mono text-[0.78rem] leading-[1.7] text-ink-muted font-medium">
          {feature.description}
        </p>
      </div>
    </div>
  )
}

export function FeaturesSection() {
  return (
    <section id="features">
      {/* Section header — full-bleed top line */}
      <div className="full-bleed-divider">
        <div className="landing-container section-header">
          <p className="eyebrow mb-4">What we offer</p>
          <h2 className="section-title">
            Everything you need for <em className="italic text-mauve">love</em>
          </h2>
          <p className="body-text mt-4 max-w-md">
            Simple, beautiful tools to help you create lasting memories and stronger bonds.
          </p>
        </div>
      </div>

      {/* Feature cards — image + text */}
      <div className="full-bleed-divider">
        <div className="landing-container">
          <div className="grid md:grid-cols-3 gap-0">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
