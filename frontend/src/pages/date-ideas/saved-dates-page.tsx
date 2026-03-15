import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, ExternalLink, Copy, Trash2, MapPin, CloudSun } from 'lucide-react'
import { DateService, type SavedDate } from '@/core/api/date-service'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

export function SavedDatesPage() {
  const [dates, setDates] = useState<SavedDate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadDates = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await DateService.listSavedDates()
      setDates(data.dates)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load saved dates')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDates()
  }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      setIsDeleting(true)
      await DateService.deleteSavedDate(deleteId)
      setDates((prev) => prev.filter((d) => d.id !== deleteId))
      setDeleteId(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCopyLink = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      window.open(url, '_blank')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner className="h-6 w-6 text-mauve" />
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-4xl lg:text-5xl text-ink font-light tracking-tight">
          Saved Dates
        </h1>
        <p className="font-mono text-[0.7rem] uppercase tracking-widest text-ink-muted/70 mt-2">
          Your favorite date itineraries
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-sm">
          <p className="text-[0.7rem] font-mono text-red-600 uppercase tracking-tight">{error}</p>
        </div>
      )}

      {dates.length === 0 ? (
        <Card className="border-ink/5">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="h-10 w-10 text-mauve/30 mb-4" />
            <h2 className="font-serif text-xl font-light text-ink mb-1">No saved dates yet</h2>
            <p className="font-mono text-[0.72rem] text-ink-muted/70 max-w-sm">
              Generate a date and save it here to keep track of your favorites.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {dates.map((date) => (
            <Card key={date.id} className="border-ink/5 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="font-serif text-xl font-light text-ink">
                      {date.title}
                    </CardTitle>
                    <CardDescription className="font-mono text-[0.7rem] text-ink-muted/70 mt-1">
                      {date.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(date.id)}
                    className="text-ink-muted/40 hover:text-red-500 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Location + weather */}
                {(date.location_name || date.weather_summary) && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-ink-muted font-mono">
                    {date.location_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {date.location_name}
                      </span>
                    )}
                    {date.weather_summary && (
                      <span className="px-2 py-0.5 bg-surface rounded-sm border border-ink/5">
                        {date.weather_summary}
                      </span>
                    )}
                  </div>
                )}

                {date.personal_touch && (
                  <p className="text-sm text-ink-muted italic mt-2">{date.personal_touch}</p>
                )}
              </CardHeader>

              <CardContent className="space-y-1">
                {/* Stops */}
                {Array.isArray(date.stops) && (date.stops as SavedDate['stops']).map((stop, index) => (
                  <div key={`${date.id}-stop-${index}`} className="relative pl-8 pb-4 last:pb-2">
                    {index < (date.stops as SavedDate['stops']).length - 1 && (
                      <div className="absolute left-[13px] top-7 bottom-0 w-px bg-mauve/20" />
                    )}
                    <div className="absolute left-1.5 top-1 w-5 h-5 rounded-full bg-mauve/10 border-2 border-mauve/30 flex items-center justify-center">
                      <span className="text-[0.6rem] font-mono font-bold text-mauve">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-ink text-sm">{stop.name}</h4>
                      <p className="text-xs text-ink-muted font-mono">
                        {stop.arrival_time} · {stop.duration_minutes} min · ~${stop.estimated_spend}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="pt-2 border-t border-ink/5">
                  <p className="font-mono text-xs text-ink-muted">
                    Total: ~${date.total_estimated_spend}
                  </p>
                </div>

                {/* Weather advice */}
                {date.weather_advice && date.weather_advice.length > 0 && (
                  <div className="pt-3 border-t border-ink/5">
                    <div className="flex items-center gap-2 mb-2">
                      <CloudSun className="h-3.5 w-3.5 text-mauve" />
                      <span className="font-mono text-[0.6rem] uppercase text-ink-muted font-medium">Advice</span>
                    </div>
                    <ul className="space-y-1">
                      {date.weather_advice.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-ink-muted">
                          <span className="text-mauve mt-px">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-3 flex flex-wrap gap-2 border-t border-ink/5">
                  {date.google_maps_url && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(date.google_maps_url!, '_blank')}
                        className="border-ink/10 text-[0.7rem]"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        Open in Google Maps
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(date.id, date.google_maps_url!)}
                        className="border-ink/10 text-[0.7rem]"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        {copiedId === date.id ? 'Copied!' : 'Copy link'}
                      </Button>
                    </>
                  )}
                </div>

                {/* Date created */}
                <p className="font-mono text-[0.6rem] text-ink-muted/40 pt-2">
                  Saved {new Date(date.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmationDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Remove Saved Date"
        description="Are you sure you want to remove this saved date? This action cannot be undone."
        confirmText="Remove"
        isDestructive
      />
    </div>
  )
}
