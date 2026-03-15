import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Heart, Sparkles, Loader2, Settings } from 'lucide-react'
import { getApiErrorMessage } from '@/core/api/client'
import { PartnershipService, getPartnerDisplayName, type Partnership } from '@/core/api/partnership-service'
import { DateService, type DateItinerary } from '@/core/api/date-service'
import { usePreferences, BUDGET_RANGES } from '@/features/preferences'

const DATE_IDEAS_KEY = 'lovetism_date_ideas'
const NO_PARTNER_VALUE = '__none__'

interface SavedDateIdea extends DateItinerary {
  savedAt?: number
}

function saveDateIdea(itinerary: DateItinerary) {
  const stored = localStorage.getItem(DATE_IDEAS_KEY)
  const list: SavedDateIdea[] = stored ? JSON.parse(stored) : []
  list.unshift({ ...itinerary, savedAt: Date.now() })
  localStorage.setItem(DATE_IDEAS_KEY, JSON.stringify(list))
}

export function DateIdeasPage() {
  const { preferences, openPreferences } = usePreferences()
  const [partnerships, setPartnerships] = useState<Partnership[]>([])
  const [ideas, setIdeas] = useState<SavedDateIdea[]>([])
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [itinerary, setItinerary] = useState<DateItinerary | null>(null)
  const [savedToIdeas, setSavedToIdeas] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    PartnershipService.list()
      .then((r) => setPartnerships(r.partnerships))
      .catch(() => setPartnerships([]))
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(DATE_IDEAS_KEY)
    setIdeas(stored ? JSON.parse(stored) : [])
  }, [itinerary])

  const budgetMax = BUDGET_RANGES.find((r) => r.id === preferences.budgetRange)?.max ?? 100

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    setItinerary(null)
    setSavedToIdeas(false)
    try {
      const result = await DateService.generate({
        partnerId: selectedPartner || null,
        vibes: preferences.vibes.length ? preferences.vibes : undefined,
        transport: preferences.transport,
        indoorOutdoor: preferences.indoorOutdoor,
        budget: budgetMax,
      })
      setItinerary(result)
    } catch (e: unknown) {
      setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleAddToDateIdeas = () => {
    if (itinerary) {
      saveDateIdea(itinerary)
      setSavedToIdeas(true)
      setIdeas((prev) => [{ ...itinerary, savedAt: Date.now() }, ...prev])
    }
  }

  const handleRemoveIdea = (index: number) => {
    const next = ideas.filter((_, i) => i !== index)
    setIdeas(next)
    localStorage.setItem(DATE_IDEAS_KEY, JSON.stringify(next))
  }

  const activePartners = partnerships.filter((p) => p.status === 'active')

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-4xl lg:text-5xl text-ink font-light tracking-tight">
          Date Ideas
        </h1>
        <p className="font-mono text-[0.7rem] uppercase tracking-widest text-ink-muted/70 mt-2">
          Saved and planned dates
        </p>
      </div>

      {/* Saved Date Ideas */}
      <section>
        <h2 className="font-serif text-xl font-light text-ink mb-4">Saved</h2>
        {ideas.length === 0 ? (
          <Card className="border-ink/5">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Heart className="h-8 w-8 text-mauve/40 mb-4" />
              <p className="font-mono text-[0.75rem] text-ink-muted/70">No saved dates yet. Generate one below.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {ideas.map((idea, index) => (
              <Card key={index} className="border-ink/5">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="font-serif text-lg font-light text-ink">{idea.title}</CardTitle>
                    <CardDescription className="font-mono text-[0.7rem] uppercase text-ink-muted/70 mt-1">
                      {idea.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveIdea(index)}
                    className="text-ink-muted hover:text-red-500 text-[0.65rem] font-mono uppercase"
                  >
                    Remove
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {idea.stops.map((stop) => (
                    <div key={stop.place_id} className="border-l-2 border-mauve/30 pl-4 py-2">
                      <p className="font-medium text-ink text-sm">{stop.name}</p>
                      <p className="text-xs text-ink-muted">
                        {stop.arrival_time} · {stop.duration_minutes} min · ~${stop.estimated_spend}
                      </p>
                    </div>
                  ))}
                  <p className="font-mono text-xs text-ink-muted pt-2">Total ~${idea.total_estimated_spend}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Date Generation */}
      <section>
        <h2 className="font-serif text-xl font-light text-ink mb-4">Generate date</h2>
        <Card className="border-ink/5">
          <CardContent className="pt-6 space-y-6">
            {/* Partner */}
            <div className="space-y-2">
              <Label className="font-mono text-[0.65rem] uppercase text-ink-muted">Partner</Label>
              <Select
                value={selectedPartner ?? NO_PARTNER_VALUE}
                onValueChange={(v) => setSelectedPartner(v === NO_PARTNER_VALUE ? null : v)}
              >
                <SelectTrigger className="w-full max-w-xs rounded-lg">
                  <SelectValue placeholder="Partner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARTNER_VALUE}>Partner</SelectItem>
                  {activePartners.map((p) => (
                    <SelectItem key={p.id} value={p.partnerId}>
                      {getPartnerDisplayName(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activePartners.length === 0 && (
                <p className="font-mono text-[0.65rem] text-ink-muted/70">
                  Add partners in Profile → Partner
                </p>
              )}
            </div>

            {error && <p className="font-mono text-xs text-red-600">{error}</p>}

            <div className="flex gap-2">
              <Button onClick={openPreferences} variant="outline" className="border-ink/10">
                <Settings className="h-4 w-4 mr-2" />
                Set preferences
              </Button>
              <Button onClick={handleGenerate} disabled={generating} className="bg-mauve text-cream hover:bg-dusty-rose">
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate date
            </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        {itinerary && (
          <Card className="border-ink/5 mt-6">
            <CardHeader>
              <CardTitle className="font-serif text-2xl font-light text-ink">{itinerary.title}</CardTitle>
              <CardDescription className="font-mono text-[0.7rem] uppercase text-ink-muted/70">
                {itinerary.description}
              </CardDescription>
              {itinerary.personal_touch && (
                <p className="text-sm text-ink-muted italic mt-2">{itinerary.personal_touch}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {itinerary.stops.map((stop) => (
                <div key={stop.place_id} className="border-l-2 border-mauve/30 pl-4 py-2">
                  <p className="font-medium text-ink">{stop.name}</p>
                  <p className="text-xs text-ink-muted">
                    {stop.arrival_time} · {stop.duration_minutes} min · ~${stop.estimated_spend}
                  </p>
                  <p className="text-sm text-ink-muted mt-1">{stop.why}</p>
                </div>
              ))}
              <p className="font-mono text-xs text-ink-muted pt-2">Total ~${itinerary.total_estimated_spend}</p>
              <div className="pt-4 flex gap-2">
                <Button
                  onClick={handleAddToDateIdeas}
                  disabled={savedToIdeas}
                  variant="outline"
                  className="border-ink/10"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  {savedToIdeas ? 'Added to Date Ideas' : 'Add to Date Ideas'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
