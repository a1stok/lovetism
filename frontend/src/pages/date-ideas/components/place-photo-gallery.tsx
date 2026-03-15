import { useState, useCallback, useEffect, useRef } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, MapPin, ExternalLink } from 'lucide-react'

interface PlacePhotoGalleryProps {
  isOpen: boolean
  onClose: () => void
  placeName: string
  googlePlaceId?: string
  photoReferences?: string[] | null
}

export function PlacePhotoGallery({
  isOpen,
  onClose,
  placeName,
  googlePlaceId,
  photoReferences = [],
}: PlacePhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset to first photo when opened and focus container for keyboard events
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0)
      // Small timeout to ensure the dialog is mounted before focusing
      setTimeout(() => {
        containerRef.current?.focus()
      }, 50)
    }
  }, [isOpen, placeName])

  const photos = photoReferences || []
  const hasPhotos = photos.length > 0
  const currentPhotoRef = hasPhotos ? photos[currentIndex] : null

  const handleNext = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setCurrentIndex((prev) => (prev + 1) % photos.length)
    },
    [photos.length]
  )

  const handlePrev = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
    },
    [photos.length]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent | KeyboardEvent) => {
      if (!isOpen || !hasPhotos) return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setCurrentIndex((prev) => (prev + 1) % photos.length)
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
      }
    },
    [isOpen, hasPhotos, photos.length]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-[95vw] p-0 overflow-hidden bg-surface border-none shadow-2xl">
        <div 
          ref={containerRef}
          tabIndex={-1}
          className="relative w-full aspect-[4/3] bg-ink/5 sm:aspect-video flex items-center justify-center focus:outline-none"
        >
          {hasPhotos && currentPhotoRef ? (
            <img
              key={currentPhotoRef}
              src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${currentPhotoRef}&key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}`}
              alt={`${placeName} photo ${currentIndex + 1}`}
              className="w-full h-full object-contain bg-ink/90 animate-in fade-in duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-ink-muted/50 p-6">
              <MapPin className="h-12 w-12 mb-4 opacity-50" />
              <p className="font-serif text-lg">No photos available</p>
              <p className="text-sm font-mono mt-2">Try viewing on Google Maps directly.</p>
            </div>
          )}

          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              
              {/* Counter Pill */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-white font-mono text-[0.65rem] tracking-widest shadow-sm">
                {currentIndex + 1} / {photos.length}
              </div>
            </>
          )}

          {/* Close button is handled natively by DialogContent, but we want a nice header overlay */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex items-start justify-between">
            <div className="text-white drop-shadow-md">
              <h2 className="font-serif text-xl sm:text-2xl font-light text-shadow">{placeName}</h2>
              {googlePlaceId && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}&query_place_id=${googlePlaceId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs opacity-90 hover:opacity-100 flex items-center gap-1.5 mt-1 transition-opacity text-shadow-sm"
                >
                  <ExternalLink className="h-3 w-3" />
                  View on Google Maps
                </a>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
