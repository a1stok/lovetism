import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, ExternalLink, Copy, Trash2, MapPin, CloudSun, User, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { DateService, type SavedDate, type DateStop } from '@/core/api/date-service'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { DateMap } from './components/date-map'
import { PlacePhotoGallery } from './components/place-photo-gallery'

type DateTab = 'saved' | 'past'

export function SavedDatesPage() {
  const [tab, setTab] = useState<DateTab>('saved')
  const [dates, setDates] = useState<SavedDate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [galleryStop, setGalleryStop] = useState<DateStop | null>(null)
  const [expandedDate, setExpandedDate] = useState<SavedDate | null>(null)

  const loadDates = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const status = tab === 'past' ? 'completed' : 'saved'
      const data = await DateService.listSavedDates(status)
      setDates(data.dates)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load saved dates')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDates()
  }, [tab])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      setIsDeleting(true)
      await DateService.deleteSavedDate(deleteId)
      setDates((prev) => prev.filter((d) => d.id !== deleteId))
      setDeleteId(null)
      if (expandedDate?.id === deleteId) setExpandedDate(null)
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

  const handleMarkComplete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      setCompletingId(id)
      await DateService.markDateCompleted(id)
      setDates((prev) => prev.filter((d) => d.id !== id))
      if (expandedDate?.id === id) setExpandedDate(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setCompletingId(null)
    }
  }

  const getPartnerSubtitle = (date: SavedDate) =>
    date.partner_name ? `Date with ${date.partner_name}` : 'Solo date'

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
        <div className="flex gap-2 mt-4">
          <Button
            variant={tab === 'saved' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTab('saved')}
            className={tab === 'saved' ? 'bg-mauve text-cream hover:bg-dusty-rose' : 'text-ink-muted hover:text-ink'}
          >
            Saved
          </Button>
          <Button
            variant={tab === 'past' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTab('past')}
            className={tab === 'past' ? 'bg-mauve text-cream hover:bg-dusty-rose' : 'text-ink-muted hover:text-ink'}
          >
            Past Dates
          </Button>
        </div>
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
            <h2 className="font-serif text-xl font-light text-ink mb-1">
              {tab === 'past' ? 'No past dates yet' : 'No saved dates yet'}
            </h2>
            <p className="font-mono text-[0.72rem] text-ink-muted/70 max-w-sm">
              {tab === 'past'
                ? 'Mark a saved date as "Went on date" to move it here.'
                : 'Generate a date and save it here to keep track of your favorites.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dates.map((date) => (
            <Card
              key={date.id}
              className="border-ink/5 overflow-hidden cursor-pointer hover:border-mauve/30 transition-colors"
              onClick={() => setExpandedDate(date)}
            >
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="font-serif text-lg font-light text-ink line-clamp-1">
                      {date.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1.5">
                      {date.partner_avatar_url ? (
                        <img
                          src={date.partner_avatar_url}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover shrink-0 border border-ink/10"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-ink-muted/20 flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-ink-muted/70" />
                        </div>
                      )}
                      <span className="font-mono text-[0.68rem] text-ink-muted/80 truncate">
                        {getPartnerSubtitle(date)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteId(date.id)
                    }}
                    className="h-7 w-7 shrink-0 text-ink-muted/50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {date.description && (
                  <p className="text-xs text-ink-muted/80 mt-2 line-clamp-2 leading-relaxed">
                    {date.description}
                  </p>
                )}
                {(date.location_name || date.total_estimated_spend) && (
                  <div className="flex items-center gap-2 mt-2 text-[0.65rem] text-ink-muted font-mono">
                    {date.location_name && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-2.5 w-2.5 shrink-0" />
                        {date.location_name}
                      </span>
                    )}
                    {date.total_estimated_spend != null && (
                      <span>~${date.total_estimated_spend}</span>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-ink/5">
                  {date.google_maps_url && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(date.google_maps_url!, '_blank')
                        }}
                        className="h-7 px-2 text-[0.65rem] text-ink-muted hover:text-ink"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open in Google Maps
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopyLink(date.id, date.google_maps_url!)
                        }}
                        className="h-7 px-2 text-[0.65rem] text-ink-muted hover:text-ink"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {copiedId === date.id ? 'Copied!' : 'Copy link'}
                      </Button>
                    </>
                  )}
                  <span className="font-mono text-[0.6rem] text-ink-muted/60">
                    Saved{' '}
                    {new Date(date.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {tab === 'saved' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleMarkComplete(date.id, e)}
                      disabled={!!completingId}
                      className="h-7 px-2 text-[0.65rem] text-mauve hover:text-mauve hover:bg-mauve/10 ml-auto"
                    >
                      {completingId === date.id ? (
                        <LoadingSpinner className="h-3 w-3" />
                      ) : (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Went on date
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Expand modal */}
      <Dialog open={!!expandedDate} onOpenChange={(open) => !open && setExpandedDate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-ink/10 rounded-xl">
          <DialogTitle className="sr-only">Date details</DialogTitle>
          {expandedDate && (
            <Card className="border-0 shadow-none rounded-none">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="font-serif text-xl font-light text-ink">
                      {expandedDate.title}
                    </CardTitle>
                    <CardDescription className="font-mono text-[0.7rem] text-ink-muted/70 mt-1">
                      {getPartnerSubtitle(expandedDate)}
                    </CardDescription>
                    {expandedDate.description && (
                      <p className="font-mono text-[0.72rem] text-ink-muted/80 mt-2">
                        {expandedDate.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(expandedDate.id)}
                    className="text-ink-muted/40 hover:text-red-500 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {(expandedDate.location_name || expandedDate.weather_summary) && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-ink-muted font-mono">
                    {expandedDate.location_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {expandedDate.location_name}
                      </span>
                    )}
                    {expandedDate.weather_summary && (
                      <span className="px-2 py-0.5 bg-surface rounded-sm border border-ink/5">
                        {expandedDate.weather_summary}
                      </span>
                    )}
                  </div>
                )}

                {expandedDate.personal_touch && (
                  <p className="text-sm text-ink-muted italic mt-2">{expandedDate.personal_touch}</p>
                )}
              </CardHeader>

              <CardContent className="space-y-6 pt-0">
                {Array.isArray(expandedDate.stops) &&
                  (expandedDate.stops as SavedDate['stops']).some(
                    (s) => s.lat != null && s.lng != null
                  ) && (
                    <DateMap
                      stops={expandedDate.stops as DateStop[]}
                      travelMode="WALKING"
                      showExpandButton={true}
                      className="rounded-lg overflow-hidden border border-ink/5"
                    />
                  )}

                {Array.isArray(expandedDate.stops) &&
                  (expandedDate.stops as SavedDate['stops']).map((stop, index) => (
                    <div
                      key={`${expandedDate.id}-stop-${index}`}
                      className="relative pl-8 pb-4 last:pb-2"
                    >
                      {index < (expandedDate.stops as SavedDate['stops']).length - 1 && (
                        <div className="absolute left-[13px] top-7 bottom-0 w-px bg-mauve/20" />
                      )}
                      <div className="absolute left-1.5 top-1 w-5 h-5 rounded-full bg-mauve/10 border-2 border-mauve/30 flex items-center justify-center">
                        <span className="text-[0.6rem] font-mono font-bold text-mauve">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            {stop.google_place_id ? (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.name)}&query_place_id=${stop.google_place_id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-ink text-sm hover:text-mauve hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve rounded-sm"
                              >
                                {stop.name}
                              </a>
                            ) : (
                              <h4 className="font-medium text-ink text-sm">{stop.name}</h4>
                            )}
                          </div>
                          <p className="text-xs text-ink-muted font-mono">
                            {stop.arrival_time} · {stop.duration_minutes} min · ~$
                            {stop.estimated_spend}
                          </p>
                        </div>

                        {stop.google_place_id && (
                          <button
                            onClick={() => setGalleryStop(stop as DateStop)}
                            className="group relative flex w-16 h-16 shrink-0 rounded-md overflow-hidden bg-surface border border-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve"
                          >
                            {stop.photo_reference ? (
                              <img
                                src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${stop.photo_reference}&key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}`}
                                alt={stop.name}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-ink-muted/10 flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-ink-muted/40" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                              <span className="text-[0.45rem] font-bold tracking-widest uppercase text-white font-mono text-center leading-tight px-1 drop-shadow-md">
                                Browse
                                <br />
                                Pictures
                              </span>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                <div className="pt-2 border-t border-ink/5">
                  <p className="font-mono text-xs text-ink-muted">
                    Total: ~${expandedDate.total_estimated_spend}
                  </p>
                </div>

                {expandedDate.weather_advice && expandedDate.weather_advice.length > 0 && (
                  <div className="pt-3 border-t border-ink/5">
                    <div className="flex items-center gap-2 mb-2">
                      <CloudSun className="h-3.5 w-3.5 text-mauve" />
                      <span className="font-mono text-[0.6rem] uppercase text-ink-muted font-medium">
                        Advice
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {expandedDate.weather_advice.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-ink-muted">
                          <span className="text-mauve mt-px">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-3 flex flex-wrap gap-2 border-t border-ink/5">
                  {expandedDate.google_maps_url && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(expandedDate.google_maps_url!, '_blank')}
                        className="border-ink/10 text-[0.7rem]"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        Open in Google Maps
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopyLink(expandedDate.id, expandedDate.google_maps_url!)
                        }
                        className="border-ink/10 text-[0.7rem]"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        {copiedId === expandedDate.id ? 'Copied!' : 'Copy link'}
                      </Button>
                    </>
                  )}
                  {expandedDate.status !== 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkComplete(expandedDate.id)}
                      disabled={!!completingId}
                      className="border-mauve/30 text-mauve hover:bg-mauve/10 text-[0.7rem]"
                    >
                      {completingId === expandedDate.id ? (
                        <LoadingSpinner className="h-3.5 w-3.5 mr-1.5" />
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          Went on date
                        </>
                      )}
                    </Button>
                  )}
                </div>

                <p className="font-mono text-[0.6rem] text-ink-muted/40 pt-2">
                  Saved{' '}
                  {new Date(expandedDate.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>

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

      {galleryStop && (
        <PlacePhotoGallery
          isOpen={!!galleryStop}
          onClose={() => setGalleryStop(null)}
          placeName={galleryStop.name}
          googlePlaceId={galleryStop.google_place_id}
          photoReferences={
            galleryStop.photo_references ||
            (galleryStop.photo_reference ? [galleryStop.photo_reference] : [])
          }
        />
      )}
    </div>
  )
}
