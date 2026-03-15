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
import { Sparkles, Loader2, Settings, MapPin, ExternalLink, Copy, Heart, RefreshCw, Star, CloudSun } from 'lucide-react'
import { getApiErrorMessage } from '@/core/api/client'
import { PartnershipService, getPartnerDisplayName, type Partnership } from '@/core/api/partnership-service'
import { DateService, type DateItinerary, type WeatherData, type GenerateDateParams } from '@/core/api/date-service'
import { generateGoogleMapsRouteUrl } from '@/core/api/google-maps'
import { usePreferences, BUDGET_RANGES } from '@/features/preferences'
import { DateLocationPicker, type SelectedLocation } from './components/date-location-picker'
import { DateMap } from './components/date-map'
import { PlacePhotoGallery } from './components/place-photo-gallery'
import { DateGeneratingOverlay } from './components/date-generating-overlay'
import type { DateStop } from '@/core/api/date-service'

const NO_PARTNER_VALUE = '__none__'

export function DateIdeasPage() {
  const { preferences, openPreferences } = usePreferences()
  const [partnerships, setPartnerships] = useState<Partnership[]>([])
  const [isLoadingPartners, setIsLoadingPartners] = useState(true)
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null)
  const [location, setLocation] = useState<SelectedLocation | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [generating, setGenerating] = useState(false)
  const [itinerary, setItinerary] = useState<DateItinerary | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [galleryStop, setGalleryStop] = useState<DateStop | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    PartnershipService.list()
      .then((r) => setPartnerships(r.partnerships))
      .catch(() => setPartnerships([]))
      .finally(() => setIsLoadingPartners(false))
  }, [])

  const budgetMax = BUDGET_RANGES.find((r) => r.id === preferences.budgetRange)?.max ?? 100
  const activePartners = partnerships.filter((p) => p.status === 'active')

  const handleLocationChange = (loc: SelectedLocation | null, w: WeatherData | null) => {
    setLocation(loc)
    setWeather(w)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    setItinerary(null)
    setSaved(false)
    setCopiedLink(false)
    try {
      const params: GenerateDateParams = {
        partnerId: selectedPartner || null,
        vibes: preferences.vibes.length ? preferences.vibes : undefined,
        transport: preferences.transport,
        indoorOutdoor: preferences.indoorOutdoor,
        budget: budgetMax,
        lat: location?.lat,
        lng: location?.lng,
        locationName: location?.name,
        weather,
      }
      const result = await DateService.generate(params)
      setItinerary({
        ...result,
        location_name: location?.name,
        weather_summary: weather ? `${weather.icon} ${weather.temperature}°C ${weather.condition}` : undefined,
      })
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Generation failed'))
    } finally {
      setGenerating(false)
    }
  }

  const mapsUrl = itinerary
    ? generateGoogleMapsRouteUrl(
        itinerary.stops,
        (preferences.transport === 'driving' ? 'driving' : preferences.transport === 'walking' ? 'walking' : 'transit') as 'walking' | 'transit' | 'driving'
      )
    : ''

  const handleSave = async () => {
    if (!itinerary) return
    setSaving(true)
    const partner = selectedPartner && selectedPartner !== NO_PARTNER_VALUE
      ? activePartners.find((p) => p.partnerId === selectedPartner)
      : null
    const partnerName = partner ? getPartnerDisplayName(partner) : null
    const partnerId = partner?.id ?? null
    try {
      await DateService.saveDate({
        ...itinerary,
        google_maps_url: mapsUrl,
        partner_name: partnerName ?? undefined,
        partner_id: partnerId ?? undefined,
      })
      setSaved(true)
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Failed to save'))
    } finally {
      setSaving(false)
    }
  }

  const handleCopyLink = async () => {
    if (!mapsUrl) return
    try {
      await navigator.clipboard.writeText(mapsUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      // Fallback for HTTP contexts
      window.open(mapsUrl, '_blank')
    }
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-4xl lg:text-5xl text-ink font-light tracking-tight">
          Generate Date
        </h1>
        <p className="font-mono text-[0.7rem] uppercase tracking-widest text-ink-muted/70 mt-2">
          AI-powered date planning with real places
        </p>
      </div>

      {/* Generation Form */}
      <Card className="border-ink/5">
        <CardContent className="pt-6 space-y-6">
          {/* Step 1: Partner */}
          <div className="space-y-2">
            <Label className="font-mono text-[0.65rem] uppercase text-ink-muted">1 · Partner</Label>
            
            {isLoadingPartners ? (
              <Select disabled>
                <SelectTrigger className="w-full max-w-xs rounded-lg opacity-50">
                  <SelectValue placeholder="Loading..." />
                </SelectTrigger>
              </Select>
            ) : (
              <Select
                value={selectedPartner ?? NO_PARTNER_VALUE}
                onValueChange={(v) => setSelectedPartner(v === NO_PARTNER_VALUE ? null : v)}
              >
                <SelectTrigger className="w-full max-w-xs rounded-lg">
                  <SelectValue placeholder="Select partner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARTNER_VALUE}>Solo / No partner</SelectItem>
                  {activePartners.map((p) => (
                    <SelectItem key={p.id} value={p.partnerId}>
                      {getPartnerDisplayName(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {!isLoadingPartners && activePartners.length === 0 && (
              <p className="font-mono text-[0.65rem] text-ink-muted/70">
                Add partners in Profile → Partner
              </p>
            )}
          </div>

          {/* Step 2: Location */}
          <div className="space-y-2">
            <Label className="font-mono text-[0.65rem] uppercase text-ink-muted">2 · Location</Label>
            <DateLocationPicker onLocationChange={handleLocationChange} />
          </div>

          {/* Step 3: Preferences + Generate */}
          <div className="space-y-2">
            <Label className="font-mono text-[0.65rem] uppercase text-ink-muted">3 · Preferences</Label>
            <div className="flex flex-wrap gap-2">
              <Button onClick={openPreferences} variant="outline" className="border-ink/10">
                <Settings className="h-4 w-4 mr-2" />
                Set preferences
              </Button>
            </div>
            {/* Summary of current preferences */}
            <div className="flex flex-wrap gap-2 pt-1">
              {preferences.vibes.length > 0 && (
                <span className="px-2 py-0.5 text-[0.65rem] font-mono text-ink-muted bg-surface rounded-sm border border-ink/5">
                  {preferences.vibes.length} vibe{preferences.vibes.length > 1 ? 's' : ''} selected
                </span>
              )}
              <span className="px-2 py-0.5 text-[0.65rem] font-mono text-ink-muted bg-surface rounded-sm border border-ink/5">
                {preferences.transport}
              </span>
              <span className="px-2 py-0.5 text-[0.65rem] font-mono text-ink-muted bg-surface rounded-sm border border-ink/5">
                {preferences.indoorOutdoor}
              </span>
              <span className="px-2 py-0.5 text-[0.65rem] font-mono text-ink-muted bg-surface rounded-sm border border-ink/5">
                {BUDGET_RANGES.find((r) => r.id === preferences.budgetRange)?.label ?? 'Budget'}
              </span>
            </div>
          </div>

          {error && <p className="font-mono text-xs text-red-600">{error}</p>}

          {/* Generate button */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-mauve text-cream hover:bg-dusty-rose"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate date
            </Button>
            {itinerary && (
              <Button
                onClick={handleGenerate}
                disabled={generating}
                variant="outline"
                className="border-ink/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Animated generating overlay */}
      <DateGeneratingOverlay isGenerating={generating} />

      {/* Generated Itinerary Result */}
      {itinerary && (
        <Card className="border-ink/5 overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="font-serif text-2xl font-light text-ink">{itinerary.title}</CardTitle>
            <CardDescription className="font-mono text-[0.7rem] uppercase text-ink-muted/70">
              {itinerary.description}
            </CardDescription>
            {itinerary.personal_touch && (
              <p className="text-sm text-ink-muted italic mt-2">{itinerary.personal_touch}</p>
            )}
            {/* Location + weather summary */}
            {(itinerary.location_name || itinerary.weather_summary) && (
              <div className="flex items-center gap-2 mt-3 text-xs text-ink-muted font-mono">
                {itinerary.location_name && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {itinerary.location_name}
                  </span>
                )}
                {itinerary.weather_summary && (
                  <span className="px-2 py-0.5 bg-surface rounded-sm border border-ink/5">
                    {itinerary.weather_summary}
                  </span>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Map */}
            <DateMap
              stops={itinerary.stops}
              travelMode={
                preferences.transport === 'driving'
                  ? 'DRIVING'
                  : preferences.transport === 'walking'
                    ? 'WALKING'
                    : 'TRANSIT'
              }
              className="mt-2"
            />

            {/* Stops timeline */}
            {itinerary.stops.map((stop, index) => (
              <div key={stop.place_id} className="relative pl-8 pb-5 last:pb-2">
                {/* Timeline line */}
                {index < itinerary.stops.length - 1 && (
                  <div className="absolute left-[13px] top-7 bottom-0 w-px bg-mauve/20" />
                )}
                {/* Timeline dot */}
                <div className="absolute left-1.5 top-1 w-5 h-5 rounded-full bg-mauve/10 border-2 border-mauve/30 flex items-center justify-center">
                  <span className="text-[0.6rem] font-mono font-bold text-mauve">{index + 1}</span>
                </div>

                <div className="space-y-1">
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
                        {stop.google_place_id && (
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-ink-muted font-mono">
                        {stop.arrival_time} · {stop.duration_minutes} min · ~${stop.estimated_spend}
                      </p>
                      <p className="text-sm text-ink-muted leading-relaxed">{stop.why}</p>
                    </div>

                    {/* Place Photo (if available) */}
                    {stop.google_place_id && (
                      <button
                        onClick={() => setGalleryStop(stop)}
                        className="group relative flex w-20 h-20 shrink-0 rounded-md overflow-hidden bg-surface border border-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve"
                      >
                        {stop.photo_reference ? (
                          <img
                            src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${stop.photo_reference}&key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}`}
                            alt={stop.name}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-ink-muted/10 flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-ink-muted/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                          <span className="text-[0.55rem] font-bold tracking-widest uppercase text-white font-mono text-center leading-tight px-1 drop-shadow-md">
                            Browse<br/>Pictures
                          </span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-2 border-t border-ink/5">
              <p className="font-mono text-xs text-ink-muted">
                Total estimated: ~${itinerary.total_estimated_spend}
              </p>
            </div>

            {/* Weather advice */}
            {itinerary.weather_advice && itinerary.weather_advice.length > 0 && (
              <div className="pt-4 border-t border-ink/5">
                <div className="flex items-center gap-2 mb-2">
                  <CloudSun className="h-4 w-4 text-mauve" />
                  <span className="font-mono text-[0.65rem] uppercase text-ink-muted font-medium">Weather advice</span>
                </div>
                <ul className="space-y-1.5">
                  {itinerary.weather_advice.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                      <span className="text-mauve mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-4 flex flex-wrap gap-2 border-t border-ink/5">
              {mapsUrl && (
                <>
                  <Button
                    onClick={() => window.open(mapsUrl, '_blank')}
                    variant="outline"
                    className="border-ink/10"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Google Maps
                  </Button>
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="border-ink/10"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copiedLink ? 'Copied!' : 'Copy route link'}
                  </Button>
                </>
              )}
              <Button
                onClick={handleSave}
                disabled={saving || saved}
                className="bg-mauve text-cream hover:bg-dusty-rose"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Heart className={`h-4 w-4 mr-2 ${saved ? 'fill-current' : ''}`} />
                )}
                {saved ? 'Saved!' : 'Save to favorites'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Gallery Modal */}
      {galleryStop && (
        <PlacePhotoGallery
          isOpen={!!galleryStop}
          onClose={() => setGalleryStop(null)}
          placeName={galleryStop.name}
          googlePlaceId={galleryStop.google_place_id}
          photoReferences={galleryStop.photo_references || (galleryStop.photo_reference ? [galleryStop.photo_reference] : [])}
        />
      )}
    </div>
  )
}
