import { useState, useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'
import { Pencil, Upload, Check, BookOpen, Trash2 } from 'lucide-react'
import { InlineEditor } from '@/components/ui/inline-editor'
import { JournalService } from './api/journal-service'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuth } from '@/features/auth/context/use-auth'
import type { JournalRow } from '@/types/journal'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

const INITIAL_VISIBLE_COUNT = 6

export function JournalPage() {
  const { user } = useAuth()
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [journals, setJournals] = useState<JournalRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch journals from Supabase on mount
  useEffect(() => {
    loadJournals()
  }, [])

  const loadJournals = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await JournalService.fetchJournals()
      setJournals(data)
    } catch (err: unknown) {
      console.error('Failed to fetch journals:', err)
      setError(err instanceof Error ? err.message : 'Failed to load journals')
    } finally {
      setIsLoading(false)
    }
  }

  const visibleJournals = journals.slice(0, visibleCount)
  const hasMoreJournals = visibleCount < journals.length

  const handleViewMore = () => {
    setVisibleCount(prev => Math.min(prev + 6, journals.length))
  }

  const handleCreateJournal = async () => {
    if (!user) return
    try {
      setIsCreating(true)
      const newJournal = await JournalService.createJournal('Untitled Journal', user.id)
      setJournals(prev => [newJournal, ...prev])
    } catch (err: unknown) {
      console.error('Failed to create journal:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditName = (journal: JournalRow) => {
    setEditingId(journal.id)
  }

  const handleSaveName = async (id: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed) {
      setEditingId(null)
      return
    }
    // Optimistic update
    setJournals(prev => prev.map(j =>
      j.id === id ? { ...j, name: trimmed } : j
    ))
    setEditingId(null)
    try {
      await JournalService.updateJournal(id, { name: trimmed })
    } catch (err: unknown) {
      console.error('Failed to persist journal name:', err)
      // Revert on failure by reloading
      loadJournals()
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
  }

  const handleImageUpload = (journalId: string) => {
    setUploadingId(journalId)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !uploadingId) return

    const journalId = uploadingId
    // Optimistic update with local blob for instant feedback
    const localUrl = URL.createObjectURL(file)
    setJournals(prev => prev.map(journal =>
      journal.id === journalId
        ? { ...journal, background_image: localUrl }
        : journal
    ))
    setUploadingId(null)

    try {
      const publicUrl = await JournalService.uploadCoverImage(journalId, file)
      // Replace blob URL with the persisted public URL
      setJournals(prev => prev.map(journal =>
        journal.id === journalId
          ? { ...journal, background_image: publicUrl }
          : journal
      ))
      URL.revokeObjectURL(localUrl)
    } catch (err: unknown) {
      console.error('Failed to upload cover image:', err)
      // Revert on failure
      setJournals(prev => prev.map(journal =>
        journal.id === journalId
          ? { ...journal, background_image: null }
          : journal
      ))
      URL.revokeObjectURL(localUrl)
    }
  }

  const handleDeleteJournal = async () => {
    if (!deleteId) return
    try {
      setIsDeleting(true)
      await JournalService.deleteJournal(deleteId)
      setJournals(prev => prev.filter(j => j.id !== deleteId))
      setDeleteId(null)
    } catch (err: unknown) {
      console.error('Failed to delete journal:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete journal')
    } finally {
      setIsDeleting(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner className="h-6 w-6 text-mauve" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-12 pb-24">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-4xl lg:text-5xl text-ink font-light tracking-tight">
            Journal
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <p className="font-mono text-[0.72rem] text-red-600 mb-4">{error}</p>
          <button onClick={loadJournals} className="btn-outline">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (journals.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-12 pb-24">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-4xl lg:text-5xl text-ink font-light tracking-tight">
            Journal
          </h1>
          <p className="font-mono text-[0.7rem] uppercase tracking-widest text-ink-muted/70">
            Your shared story, written together
          </p>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="w-20 h-20 rounded-2xl bg-blush/30 flex items-center justify-center mb-6">
            <BookOpen className="h-9 w-9 text-mauve/60" />
          </div>
          <h2 className="font-serif text-2xl lg:text-3xl text-ink font-light mb-2">
            Create your first journal
          </h2>
          <p className="font-mono text-[0.72rem] text-ink-muted/70 max-w-sm mb-8 leading-relaxed">
            A journal is your shared space — fill it with memories, notes, and moments that matter.
          </p>
          <button
            onClick={handleCreateJournal}
            disabled={isCreating}
            className="btn-primary"
          >
            {isCreating ? <LoadingSpinner className="mr-2 h-3 w-3" /> : null}
            Start a Journal
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-4xl lg:text-5xl text-ink font-light tracking-tight">
          Journal
        </h1>
        <p className="font-mono text-[0.7rem] uppercase tracking-widest text-ink-muted/70">
          Your shared story, written together
        </p>
      </div>

      {/* Grid Layout for Journal Cards */}
      <div className="flex flex-col items-center space-y-8">
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {visibleJournals.map((journal) => (
              <Link
                key={journal.id}
                to="/journal/$journalId"
                params={{ journalId: journal.id }}
                className="block"
              >
                <Card className="group overflow-hidden rounded-2xl transition-all duration-200 hover:shadow-lg flex flex-col h-full bg-white border-ink/5">
                  {/* Journal Name Section - Top */}
                  <div className="p-4 bg-white border-b border-ink/5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {editingId === journal.id ? (
                          <InlineEditor
                            value={journal.name}
                            onSave={(newName) => handleSaveName(journal.id, newName)}
                            onCancel={handleCancelEdit}
                            className="text-lg font-semibold text-ink"
                          />
                        ) : (
                          <h3 className="font-serif text-lg font-medium text-ink truncate">
                            {journal.name}
                          </h3>
                        )}
                      </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (editingId === journal.id) {
                                setEditingId(null)
                              } else {
                                handleEditName(journal)
                              }
                            }}
                            className="shrink-0 p-2 text-ink-muted/40 hover:text-ink-muted transition-colors rounded-full hover:bg-surface"
                          >
                            {editingId === journal.id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Pencil className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setDeleteId(journal.id)
                            }}
                            className="shrink-0 p-2 text-ink-muted/40 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                            title="Delete Journal"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                    </div>
                  </div>

                  {/* Image Preview Section */}
                  <div
                    className="relative flex-1 min-h-[192px] w-full cursor-pointer overflow-hidden bg-gradient-to-br from-blush/20 to-surface"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleImageUpload(journal.id)
                    }}
                  >
                    {journal.background_image ? (
                      <img
                        src={journal.background_image}
                        alt={journal.name}
                        className="absolute inset-0 w-full h-full object-cover transition-all duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                        <img
                          src="/images/upload-default.png"
                          alt="Upload default"
                          className="w-full h-full object-cover opacity-60 transition-all duration-200 group-hover:scale-105"
                        />
                      </div>
                    )}

                    {/* Upload overlay on hover */}
                    <div className="absolute inset-0 bg-ink/15 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-3 shadow-sm transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
                        <Upload className="h-5 w-5 text-ink" />
                      </div>
                    </div>
                  </div>

                  {/* Meta footer */}
                  <div className="p-3 bg-white border-t border-ink/5">
                    <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-muted/50">
                      {new Date(journal.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={handleCreateJournal}
            disabled={isCreating}
            className="btn-primary"
          >
            {isCreating ? <LoadingSpinner className="mr-2 h-3 w-3" /> : null}
            New Journal
          </button>
          {hasMoreJournals && (
            <button onClick={handleViewMore} className="btn-outline">
              View More
            </button>
          )}
        </div>
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <ConfirmationDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteJournal}
        isLoading={isDeleting}
        title="Delete Journal"
        description="Are you sure you want to delete this journal? This action cannot be undone and all entries will be lost."
        confirmText="Delete"
        isDestructive
      />
    </div>
  )
}
