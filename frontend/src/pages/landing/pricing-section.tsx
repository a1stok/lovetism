import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Get started with the basics',
    features: ['Plan dates', 'Save memories', 'Basic suggestions'],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/mo',
    description: 'For couples who want more',
    features: ['Everything in Free', 'Advanced date ideas', 'Shared journals', 'Reminders'],
    highlighted: true,
  },
  {
    name: 'Couple',
    price: '$15',
    period: '/mo',
    description: 'The complete experience',
    features: ['Everything in Pro', 'Collaboration', 'Shared environment'],
    highlighted: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing">
      {/* Section header — full-bleed top line */}
      <div className="full-bleed-divider">
        <div className="landing-container section-header">
          <p className="eyebrow mb-4">Pricing</p>
          <h2 className="section-title">
            Simple, <em className="italic text-mauve">intentional</em> pricing
          </h2>
          <p className="body-text mt-4 max-w-md">
            Start free. Upgrade when you're ready to do more together.
          </p>
        </div>
      </div>

      {/* 3-column grid — full-bleed top line */}
      <div className="full-bleed-divider">
        <div className="landing-container">
          <div className="grid md:grid-cols-[1fr_1px_1fr_1px_1fr]">
            {plans.map((plan, index) => (
              <>
                {index > 0 && <div key={`div-${index}`} className="hidden md:block bg-divider" />}
                <div
                  key={plan.name}
                  className={cn(
                    'py-12 md:py-16 flex flex-col',
                    index > 0 && 'border-t md:border-t-0 border-divider',
                    index === 0 ? 'md:pr-10' : index === 1 ? 'md:px-10' : 'md:pl-10',
                  )}
                >
                  <p className="eyebrow mb-8">{plan.name}</p>

                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-serif font-light text-4xl md:text-5xl text-ink">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="font-mono text-[0.68rem] text-ink-muted">{plan.period}</span>
                    )}
                  </div>

                  <p className="font-mono text-[0.72rem] text-ink-muted mb-10">{plan.description}</p>

                  <ul className="space-y-3.5 mb-10 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5">
                        <Check className="h-3.5 w-3.5 text-mauve flex-shrink-0" />
                        <span className="font-mono text-[0.72rem] text-ink-muted">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href="/journal"
                    className={cn(
                      plan.highlighted ? 'btn-primary w-full' : 'btn-outline w-full',
                    )}
                  >
                    Get Started
                  </a>
                </div>
              </>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
