import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuth } from '@/features/auth/context/use-auth'
import { ProfileService } from '../api/profile-service'
import { Camera, LogOut } from 'lucide-react'

export function ProfileForm() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [lastName, setLastName] = useState(profile?.last_name || '')
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '')
      setLastName(profile.last_name || '')
    }
  }, [profile])

  // Clean up blob URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Upload avatar if user selected a new one
      if (pendingAvatar) {
        await ProfileService.uploadAvatar(user.id, pendingAvatar)
        setPendingAvatar(null)
        if (avatarPreview) {
          URL.revokeObjectURL(avatarPreview)
          setAvatarPreview(null)
        }
      }

      await ProfileService.updateProfile(user.id, {
        first_name: firstName,
        last_name: lastName
      })
      setSuccess(true)
      await refreshProfile()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]

    // Clean up previous preview
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)

    // Stage file and show local preview — no upload yet
    setPendingAvatar(file)
    setAvatarPreview(URL.createObjectURL(file))
    setSuccess(false)
  }

  // Show pending preview, or existing avatar, or initials
  const displayAvatarUrl = avatarPreview || profile?.avatar_url

  return (
    <div className="max-w-2xl w-full mx-auto space-y-8">
      {/* Form Section */}
      <div className="w-full space-y-6">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-sm">
            <p className="text-[0.7rem] font-mono text-red-600 uppercase tracking-tight">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-sm">
            <p className="text-[0.7rem] font-mono text-green-600 uppercase tracking-tight">Profile updated successfully</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            
            {/* Avatar Column */}
            <div className="col-span-1 flex flex-col items-center gap-4">
              <div className="relative group cursor-pointer">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-ink/10 bg-black/5">
                  {displayAvatarUrl ? (
                    <img 
                      src={displayAvatarUrl} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-muted/30 font-serif text-4xl">
                      {firstName.charAt(0)}{lastName.charAt(0)}
                    </div>
                  )}
                </div>
                
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                  <Camera size={24} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarChange}
                    disabled={isLoading}
                  />
                </label>
              </div>
              <p className="text-[0.65rem] font-mono uppercase text-ink-muted/60 text-center">
                {pendingAvatar ? 'New photo selected — click Save' : 'Profile Photo'}
              </p>
            </div>

            {/* Names Column */}
            <div className="col-span-1 md:col-span-2 space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="font-mono text-[0.65rem] uppercase text-ink-muted/70">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-10 border-ink/10 bg-transparent rounded-sm font-mono text-[0.85rem]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="font-mono text-[0.65rem] uppercase text-ink-muted/70">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-10 border-ink/10 bg-transparent rounded-sm font-mono text-[0.85rem]"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <Label className="font-mono text-[0.65rem] uppercase text-ink-muted/70">Email Access</Label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => signOut()}
                    className="h-auto p-0 text-[0.65rem] font-mono uppercase text-red-500/70 hover:text-red-600 hover:bg-transparent"
                  >
                    <LogOut className="w-3 h-3 mr-1" />
                    Logout
                  </Button>
                </div>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="h-10 border-ink/10 bg-black/5 rounded-sm font-mono text-[0.85rem] text-ink-muted"
                />
                <p className="text-[0.6rem] font-mono text-ink-muted/50 mt-1">Email cannot be changed directly.</p>
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end border-t border-ink/10">
            <Button
              type="submit"
              className="font-mono text-[0.72rem] uppercase tracking-editorial h-11 bg-mauve text-white hover:bg-dusty-rose transition-colors px-8"
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner className="mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
