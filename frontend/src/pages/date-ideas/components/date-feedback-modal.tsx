import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DateStop, StopFeedback, StopFeedbackRating } from '@/core/api/date-service'

const RATINGS: { value: StopFeedbackRating; label: string; emoji: string }[] = [
  { value: 'satisfied', label: 'Satisfied', emoji: '😄' },
  { value: 'good', label: 'Good', emoji: '🙂' },
  { value: 'okay', label: 'Okay', emoji: '😐' },
  { value: 'not_good', label: 'Not good', emoji: '😕' },
  { value: 'bad', label: 'Bad', emoji: '😞' },
]

interface DateFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  stops: DateStop[]
  onSubmit: (feedback: StopFeedback[]) => void
  isSubmitting: boolean
}

export function DateFeedbackModal({
  isOpen,
  onClose,
  stops,
  onSubmit,
  isSubmitting,
}: DateFeedbackModalProps) {
  const [feedback, setFeedback] = useState<Record<number, StopFeedbackRating>>({})
  const [feedbackText, setFeedbackText] = useState<Record<number, string>>({})

  const handleSubmit = () => {
    const arr: StopFeedback[] = stops
      .map((_, index) => {
        const rating = feedback[index]
        const text = feedbackText[index]?.trim() || null
        if (!rating && !text) return null
        return {
          stop_index: index,
          rating: (rating ?? 'okay') as StopFeedbackRating,
          feedback: text,
        }
      })
      .filter((x): x is StopFeedback => x != null)
    onSubmit(arr)
    setFeedback({})
    setFeedbackText({})
  }

  const handleSubmitWithoutFeedback = () => {
    onSubmit([])
    setFeedback({})
    setFeedbackText({})
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFeedback({})
      setFeedbackText({})
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md border-ink/10 rounded-xl">
        <DialogTitle className="font-serif text-xl font-light text-ink">
          How was each spot?
        </DialogTitle>
        <p className="font-mono text-[0.7rem] text-ink-muted/80 mt-1">
          Optional — tap a smile for each location
        </p>

        <div className="space-y-6 mt-6">
          {stops.map((stop, index) => (
            <div
              key={index}
              className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <p className="font-medium text-ink text-sm mb-2">{stop.name}</p>
              <div className="flex gap-2 flex-wrap mb-2">
                {RATINGS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() =>
                      setFeedback((prev) => {
                        const next = { ...prev }
                        if (next[index] === r.value) delete next[index]
                        else next[index] = r.value
                        return next
                      })
                    }
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-lg
                      transition-all duration-200 hover:scale-110
                      ${feedback[index] === r.value
                        ? 'bg-mauve/20 ring-2 ring-mauve border-2 border-mauve/40'
                        : 'bg-surface border border-ink/10 hover:border-mauve/30'}
                    `}
                    title={r.label}
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Feedback (optional)"
                value={feedbackText[index] ?? ''}
                onChange={(e) =>
                  setFeedbackText((prev) => ({ ...prev, [index]: e.target.value }))
                }
                className="input-editorial h-9 text-[0.8rem]"
              />
            </div>
          ))}
        </div>

        <DialogFooter className="mt-6 gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="ghost"
            onClick={handleSubmitWithoutFeedback}
            disabled={isSubmitting}
            className="text-ink-muted"
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-mauve text-cream hover:bg-dusty-rose"
          >
            {isSubmitting ? 'Saving…' : 'Done'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
