import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { supabase } from '@/lib/supabase'
import { useNavigate } from '@tanstack/react-router'

/**
 * UpdatePasswordForm is used when the user lands on the site via a recovery link.
 * SRP: It only handles the final step of updating the password.
 */
export function UpdatePasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md w-full mx-auto p-8 bg-[var(--cream)] rounded-xl shadow-lg border border-ink/5">
        <div className="text-center space-y-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-light text-ink">Password Updated</h2>
          <p className="font-mono text-[0.7rem] uppercase text-ink-muted/70 tracking-tight">
            Your password has been changed successfully
          </p>
          <Button
            onClick={() => navigate({ to: '/' })}
            className="w-full font-mono text-[0.72rem] uppercase tracking-editorial h-11 bg-mauve text-white hover:bg-dusty-rose transition-colors"
          >
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md w-full mx-auto p-8 bg-[var(--cream)] rounded-xl shadow-lg border border-ink/5">
      <div className="text-center mb-8">
        <h2 className="font-serif text-3xl font-light text-ink mb-2">Create New Password</h2>
        <p className="font-mono text-[0.7rem] uppercase text-ink-muted/70 tracking-tight">
          Enter your new credentials below
        </p>
      </div>

      {error && (
        <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 rounded-sm">
          <p className="text-[0.7rem] font-mono text-red-600 uppercase tracking-tight">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="font-mono text-[0.65rem] uppercase text-ink-muted/70">New Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-10 border-ink/10 bg-transparent rounded-sm font-mono text-[0.85rem]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="font-mono text-[0.65rem] uppercase text-ink-muted/70">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="h-10 border-ink/10 bg-transparent rounded-sm font-mono text-[0.85rem]"
          />
        </div>
        <Button
          type="submit"
          className="w-full mt-4 font-mono text-[0.72rem] uppercase tracking-editorial h-11 bg-mauve text-white hover:bg-dusty-rose transition-colors"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner /> : 'Update Password'}
        </Button>
      </form>
    </div>
  )
}
