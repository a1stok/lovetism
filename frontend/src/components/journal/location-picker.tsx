import usePlacesAutocomplete from 'use-places-autocomplete'
import { Input } from '@/components/ui/input'
import { Search, MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LocationPickerProps {
    onSelect: (place: { name: string; address: string; url: string }) => void
    className?: string
}

export function LocationPicker({ onSelect, className }: LocationPickerProps) {
    // Check if google maps is loaded
    const isGoogleLoaded = typeof google !== 'undefined'

    if (!isGoogleLoaded) {
        return (
            <div className={cn("p-4 text-center space-y-3 bg-red-50 rounded-lg border border-red-100", className)}>
                <MapPin className="h-8 w-8 text-red-400 mx-auto" />
                <div className="space-y-1">
                    <p className="text-sm font-medium text-red-900">Google Maps not loaded</p>
                    <p className="text-xs text-red-600 leading-relaxed">
                        Please check your internet connection and API key in .env
                    </p>
                </div>
            </div>
        )
    }

    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            /* Define search scope here */
        },
        debounce: 300,
    })

    const handleSelect = (suggestion: google.maps.places.AutocompletePrediction) => {
        const { description } = suggestion
        
        setValue(description, false)
        clearSuggestions()

        // Generate Google Maps URL
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(description)}&query_place_id=${suggestion.place_id}`
        
        onSelect({
            name: description.split(',')[0], // Use the first part of the address as the name
            address: description,
            url
        })
    }

    return (
        <div className={cn("w-full space-y-2", className)}>
            <div className="relative">
                <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={!ready}
                    placeholder="Search for a place..."
                    className="pl-9 pr-4 py-5 rounded-lg border-gray-200 focus:border-primary/50 focus:ring-primary/20"
                    autoFocus
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {!ready ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </div>
            </div>

            {status === "OK" && (
                <ul className="max-h-60 overflow-y-auto rounded-lg border border-gray-100 bg-white py-1 shadow-sm">
                    {data.map((suggestion) => (
                        <li
                            key={suggestion.place_id}
                            onClick={() => handleSelect(suggestion)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                            <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium text-gray-900 truncate">
                                    {suggestion.structured_formatting.main_text}
                                </span>
                                <span className="text-xs text-gray-500 truncate">
                                    {suggestion.structured_formatting.secondary_text}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
