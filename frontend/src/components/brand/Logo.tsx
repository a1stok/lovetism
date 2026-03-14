import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'light' | 'dark'
  size?: 'navbar' | 'hero' | 'display'
  className?: string
}

const sizeConfig = {
  navbar: { markW: 10, markH: 25, stroke: 2.8, textSize: 'text-xl', gap: 'gap-[9px]' },
  hero: { markW: 22, markH: 56, stroke: 2, textSize: 'text-4xl', gap: 'gap-3' },
  display: { markW: 18, markH: 46, stroke: 2.2, textSize: 'text-3xl', gap: 'gap-[13px]' },
} as const

export function Logo({ variant = 'light', size = 'navbar', className }: LogoProps) {
  const markColor = variant === 'dark' ? '#E8A0A0' : '#C97B7B'
  const textColor = variant === 'dark' ? 'text-cream' : 'text-ink'
  const config = sizeConfig[size]

  return (
    <div className={cn('flex items-center', config.gap, className)}>
      <svg
        width={config.markW}
        height={config.markH}
        viewBox="0 0 18 48"
        fill="none"
        className="shrink-0"
      >
        <path
          d="M 15,3 C 3,12 3,36 15,45"
          stroke={markColor}
          strokeWidth={config.stroke}
          strokeLinecap="round"
        />
      </svg>
      <span
        className={cn(
          'font-serif italic font-medium tracking-tight',
          config.textSize,
          textColor,
        )}
      >
        Lovetism
      </span>
    </div>
  )
}
