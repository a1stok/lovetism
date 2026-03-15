import { useState, useCallback } from 'react'
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete'
import { Input } from '@/components/ui/input'
import { Search, MapPin, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DateService, type WeatherData } from '@/core/api/date-service'

export interface SelectedLocation {
  name: string
  address: string
  lat: number
  lng: number
}

interface DateLocationPickerProps {
  onLocationChange: (location: SelectedLocation | null, weather: WeatherData | null) => void
  className?: string
}

export function DateLocationPicker({ onLocationChange, className }: DateLocationPickerProps) {
  const [selected, setSelected] = useState<SelectedLocation | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loadingWeather, setLoadingWeather] = useState(false)

  const isGoogleLoaded = typeof google !== 'undefined'

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {},
    debounce: 300,
  })

  const handleSelect = useCallback(async (suggestion: google.maps.places.AutocompletePrediction) => {
    const { description } = suggestion
    setValue(description, false)
    clearSuggestions()

    try {
      const results = await getGeocode({ address: description })
      const { lat, lng } = getLatLng(results[0])
      const name = suggestion.structured_formatting.main_text
      const location: SelectedLocation = { name, address: description, lat, lng }

      setSelected(location)
      setLoadingWeather(true)

      try {
        const weatherData = await DateService.fetchWeather(lat, lng)
        setWeather(weatherData)
        onLocationChange(location, weatherData)
      } catch {
        setWeather(null)
        onLocationChange(location, null)
      } finally {
        setLoadingWeather(false)
      }
    } catch {
      // Geocoding failed — still usable without lat/lng
    }
  }, [setValue, clearSuggestions, onLocationChange])

  const handleClear = useCallback(() => {
    setValue('')
    setSelected(null)
    setWeather(null)
    onLocationChange(null, null)
  }, [setValue, onLocationChange])

  if (!isGoogleLoaded) {
    return (
      <div className={cn('p-3 text-center bg-amber-50 rounded-lg border border-amber-100', className)}>
        <p className="text-xs text-amber-700 font-mono">Google Maps loading...</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Search input */}
      {!selected && (
        <div className="relative">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={!ready}
            placeholder="Search for a city or area..."
            className="pl-9 pr-4 py-5 rounded-lg border-ink/10 bg-transparent font-mono text-[0.85rem]"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted/40">
            {!ready ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {status === 'OK' && !selected && (
        <ul className="max-h-48 overflow-y-auto rounded-lg border border-ink/5 bg-white py-1 shadow-sm">
          {data.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface cursor-pointer transition-colors"
            >
              <MapPin className="h-4 w-4 text-ink-muted/40 shrink-0" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-ink truncate">
                  {suggestion.structured_formatting.main_text}
                </span>
                <span className="text-xs text-ink-muted truncate">
                  {suggestion.structured_formatting.secondary_text}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Selected location + weather badge */}
      {selected && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-ink/5 bg-surface/30">
          <MapPin className="h-4 w-4 text-mauve shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{selected.name}</p>
            <p className="text-xs text-ink-muted truncate">{selected.address}</p>
          </div>

          {/* Weather badge */}
          {loadingWeather && (
            <div className="flex items-center gap-1 text-ink-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="text-xs font-mono">weather...</span>
            </div>
          )}
          {weather && !loadingWeather && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-ink/5 shrink-0">
              <span className="text-base">{weather.icon}</span>
              <span className="text-sm font-medium text-ink">{weather.temperature}°C</span>
              <span className="text-xs text-ink-muted hidden sm:inline">{weather.condition}</span>
            </div>
          )}

          {/* Clear button */}
          <button
            onClick={handleClear}
            className="p-1 rounded-full text-ink-muted/40 hover:text-ink-muted hover:bg-surface transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
