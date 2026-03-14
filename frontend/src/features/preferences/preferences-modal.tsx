import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePreferences, BUDGET_RANGES } from './preferences-context'
import { DateService } from '@/core/api/date-service'

const VIBES = [
  { id: 'cozy', label: 'Cozy' },
  { id: 'adventurous', label: 'Adventurous' },
  { id: 'fancy', label: 'Fancy' },
  { id: 'chill', label: 'Chill' },
  { id: 'romantic', label: 'Romantic' },
  { id: 'fun', label: 'Fun' },
  { id: 'cultural', label: 'Cultural' },
  { id: 'foodie', label: 'Foodie' },
]

const TRANSPORT = [
  { id: 'walking', label: 'Walking' },
  { id: 'transit', label: 'Transit' },
  { id: 'driving', label: 'Drive / Uber' },
]

const INDOOR_OUTDOOR = [
  { id: 'indoor', label: 'Indoor' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'both', label: 'Both' },
]

interface PreferencesModalProps {
  open: boolean
  onClose: () => void
}

export function PreferencesModal({ open, onClose }: PreferencesModalProps) {
  const { preferences, updatePreferences } = usePreferences()
  const [vibes, setVibes] = useState<string[]>(preferences.vibes)
  const [vibeText, setVibeText] = useState('')
  const [matching, setMatching] = useState(false)
  const [transport, setTransport] = useState(preferences.transport)
  const [indoorOutdoor, setIndoorOutdoor] = useState(preferences.indoorOutdoor)
  const [budgetRange, setBudgetRange] = useState(preferences.budgetRange)

  useEffect(() => {
    if (open) {
      setVibes(preferences.vibes)
      setTransport(preferences.transport)
      setIndoorOutdoor(preferences.indoorOutdoor)
      setBudgetRange(preferences.budgetRange)
    }
  }, [open, preferences])

  const handleMatchVibes = async () => {
    const text = vibeText.trim()
    if (!text) return
    setMatching(true)
    try {
      const { vibes: matched } = await DateService.matchVibes(text)
      if (matched.length) {
        setVibes(matched)
        updatePreferences({ vibes: matched })
      }
    } catch {
      // Silent fail; user can pick manually
    } finally {
      setMatching(false)
    }
  }

  const toggleVibe = (id: string) => {
    const next = vibes.includes(id) ? vibes.filter((v) => v !== id) : [...vibes, id]
    setVibes(next)
    updatePreferences({ vibes: next })
  }

  const handleSave = () => {
    updatePreferences({ vibes, transport, indoorOutdoor, budgetRange })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md bg-cream text-ink border-ink/5">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl font-light text-ink">
            Date preferences
          </DialogTitle>
          <DialogDescription className="font-mono text-[0.7rem] uppercase text-ink-muted/70">
            Defaults for date generation
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="font-mono text-[0.65rem] uppercase text-ink-muted">Vibes</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Describe your ideal date vibe (e.g. relaxed, romantic, good food)..."
                value={vibeText}
                onChange={(e) => setVibeText(e.target.value)}
                className="flex-1 min-w-0 input-editorial"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMatchVibes}
                disabled={!vibeText.trim() || matching}
                className="border-ink/10 shrink-0"
              >
                {matching ? 'Matching...' : 'Match'}
              </Button>
            </div>
            <p className="font-mono text-[0.6rem] text-ink-muted/70">
              AI will map your description to the options below. You can also pick manually.
            </p>
            <div className="flex flex-wrap gap-2">
              {VIBES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => toggleVibe(v.id)}
                  className={`px-3 py-1.5 text-[0.75rem] rounded-sm border transition-colors ${
                    vibes.includes(v.id)
                      ? 'border-mauve bg-blush/20 text-ink'
                      : 'border-ink/10 hover:border-ink/20 text-ink-muted'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-mono text-[0.65rem] uppercase text-ink-muted">Transport</Label>
            <div className="flex gap-2">
              {TRANSPORT.map((t) => (
                <Button
                  key={t.id}
                  variant={transport === t.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setTransport(t.id)
                    updatePreferences({ transport: t.id })
                  }}
                  className={transport === t.id ? 'bg-mauve text-cream hover:bg-dusty-rose' : 'border-ink/10'}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-mono text-[0.65rem] uppercase text-ink-muted">Indoor / Outdoor</Label>
            <div className="flex gap-2">
              {INDOOR_OUTDOOR.map((o) => (
                <Button
                  key={o.id}
                  variant={indoorOutdoor === o.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setIndoorOutdoor(o.id)
                    updatePreferences({ indoorOutdoor: o.id })
                  }}
                  className={indoorOutdoor === o.id ? 'bg-mauve text-cream hover:bg-dusty-rose' : 'border-ink/10'}
                >
                  {o.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-mono text-[0.65rem] uppercase text-ink-muted">Budget</Label>
            <div className="flex flex-wrap gap-2">
              {BUDGET_RANGES.map((r) => (
                <Button
                  key={r.id}
                  variant={budgetRange === r.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setBudgetRange(r.id)
                    updatePreferences({ budgetRange: r.id })
                  }}
                  className={budgetRange === r.id ? 'bg-mauve text-cream hover:bg-dusty-rose' : 'border-ink/10'}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          </div>
          <Button onClick={handleSave} className="w-full bg-mauve text-cream hover:bg-dusty-rose">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
