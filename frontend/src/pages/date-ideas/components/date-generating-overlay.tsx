import { useState, useEffect } from 'react'
import { Heart, CloudSun, MapPin, Star, Sparkles } from 'lucide-react'

const STEPS = [
  { icon: Heart, label: 'Collecting preferences' },
  { icon: CloudSun, label: 'Checking weather' },
  { icon: MapPin, label: 'Selecting locations' },
  { icon: Star, label: 'Reviewing ratings' },
  { icon: Sparkles, label: 'Generating itinerary' },
]

const STEP_INTERVAL = 400 // ms per step — fast and snappy

interface DateGeneratingOverlayProps {
  isGenerating: boolean
}

export function DateGeneratingOverlay({ isGenerating }: DateGeneratingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isGenerating) {
      setCurrentStep(0)
      setIsVisible(true)
    } else {
      const timeout = setTimeout(() => setIsVisible(false), 400)
      return () => clearTimeout(timeout)
    }
  }, [isGenerating])

  // Rapid-fire through first 4 steps, then hold on the last one
  useEffect(() => {
    if (!isGenerating || currentStep >= STEPS.length - 1) return
    const timer = setTimeout(() => setCurrentStep((p) => p + 1), STEP_INTERVAL)
    return () => clearTimeout(timer)
  }, [isGenerating, currentStep])

  if (!isVisible) return null

  const StepIcon = STEPS[currentStep].icon
  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        transition-opacity duration-400
        ${isGenerating ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
    >
      <div className="absolute inset-0 bg-cream/80 backdrop-blur-md" />

      <div className="relative flex flex-col items-center gap-6 px-6 max-w-sm w-full">
        {/* Pulsing icon */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-20 h-20 rounded-full border border-mauve/20 animate-ping" style={{ animationDuration: '1.8s' }} />
          <div className="absolute w-16 h-16 rounded-full border border-mauve/15 animate-pulse" />
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-mauve to-dusty-rose flex items-center justify-center text-cream shadow-lg shadow-mauve/20">
            <StepIcon
              key={currentStep}
              className="h-5 w-5 animate-in fade-in zoom-in-75 duration-300"
            />
          </div>
        </div>

        {/* Label */}
        <p
          key={currentStep}
          className="font-serif text-lg text-ink font-light tracking-tight animate-in fade-in slide-in-from-bottom-1 duration-300"
        >
          {STEPS[currentStep].label}
        </p>

        {/* Progress bar */}
        <div className="w-40 h-[2px] bg-ink/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-mauve to-dusty-rose rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`
                w-1.5 h-1.5 rounded-full transition-all duration-300
                ${i < currentStep ? 'bg-mauve/40' : i === currentStep ? 'bg-mauve scale-150' : 'bg-ink/10'}
              `}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
