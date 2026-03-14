import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { DialogDescription } from '@/components/ui/dialog'
import { AuthService } from '../api/auth-service'

interface ResetPasswordFormProps {
  onBack: () => void
}

export function ResetPasswordForm({ onBack }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await AuthService.resetPassword(email)
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while sending the reset link')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-sm">
          <p className="text-[0.7rem] font-mono text-green-600 uppercase tracking-tight">
            Reset link sent! Check your inbox.
          </p>
        </div>
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="font-mono text-[0.65rem] uppercase text-ink-muted/70 hover:text-ink transition-colors"
        >
          Back to Login
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <DialogDescription className="font-mono text-[0.65rem] uppercase text-ink-muted/70">
          Enter your email and we'll send you a link to reset your password.
        </DialogDescription>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-sm">
          <p className="text-[0.7rem] font-mono text-red-600 uppercase tracking-tight">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="font-mono text-[0.65rem] uppercase text-ink-muted/70">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            className="h-10 border-ink/10 bg-transparent rounded-sm font-mono text-[0.85rem]"
          />
        </div>
        <Button
          type="submit"
          className="w-full mt-2 font-mono text-[0.72rem] uppercase tracking-editorial h-11 bg-mauve text-white hover:bg-dusty-rose transition-colors"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner /> : 'Send Reset Link'}
        </Button>
        <Button 
          variant="ghost" 
          type="button"
          onClick={onBack}
          className="w-full font-mono text-[0.65rem] uppercase text-ink-muted/70 hover:text-ink transition-colors"
        >
          Back to Login
        </Button>
      </form>
    </div>
  )
}
