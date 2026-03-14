import { useRef, useState } from 'react'

interface Feature {
  video: string
  image: string
  eyebrow: string
  title: string
  description: string
}

const features: Feature[] = [
  {
    video: '/videos/flowers-left.mp4',
    image: '/images/landing/date-ideas.png',
    eyebrow: '01',
    title: 'Date Ideas',
    description:
      'Personalized suggestions for dates, surprises, and special moments — tailored to you.',
  },
  {
    video: '/videos/vid2.mp4',
    image: '/images/landing/memories-journal.png',
    eyebrow: '02',
    title: 'Memories Journal',
    description:
      'Capture memories and milestones in a beautiful private space that grows with you.',
  },
  {
    video: '/videos/flowers-right.mp4',
    image: '/images/landing/couple-profiles.png',
    eyebrow: '03',
    title: 'Couple Profiles',
    description:
      'Celebrate your unique love story and connect with a community of loving couples.',
  },
]

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleMouseEnter = () => {
    videoRef.current?.play().catch(() => {})
    setIsPlaying(true)
  }

  const handleMouseLeave = () => {
    videoRef.current?.pause()
    setIsPlaying(false)
  }

  const handleClick = () => {
    if (isPlaying) {
      videoRef.current?.pause()
      setIsPlaying(false)
    } else {
      videoRef.current?.play().catch(() => {})
      setIsPlaying(true)
    }
  }

  return (
    <div
      className={`feature-card group h-full flex flex-col cursor-pointer ${
        index > 0 ? 'border-t md:border-t-0 md:border-l border-divider' : ''
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Video */}
      <div className="aspect-[4/3] overflow-hidden bg-ink/5 relative">
        <video
          ref={videoRef}
          src={feature.video}
          poster={feature.image}
          muted
          playsInline
          loop
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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

      {/* Feature cards — video + text side by side vertically in grid */}
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
