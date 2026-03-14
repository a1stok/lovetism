import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AuthService } from '../api/auth-service'

interface RegisterFormProps {
  onSuccess: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const data = await AuthService.register({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })

      // If Supabase returned a session (email confirmation disabled), redirect immediately
      if (data.session) {
        onSuccess()
        return
      }

      // Otherwise, email confirmation is required — show the message
      setIsRegistered(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration')
    } finally {
      setIsLoading(false)
    }
  }

  // Show success message after registration
  if (isRegistered) {
    return (
      <div className="space-y-4 text-center py-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-serif text-xl text-ink">Check your email</h3>
        <p className="font-mono text-[0.75rem] text-ink-muted/70 leading-relaxed">
          We sent a confirmation link to<br />
          <span className="text-ink font-medium">{email}</span>
        </p>
        <p className="font-mono text-[0.65rem] text-ink-muted/50 uppercase tracking-tight">
          Click the link in the email to activate your account
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-ink">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-sm">
          <p className="text-[0.7rem] font-mono text-red-600 uppercase tracking-tight">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="font-mono text-[0.65rem] uppercase text-ink-muted/70">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="h-10 border-ink/10 bg-cream/50 rounded-sm font-mono text-[0.85rem] text-ink placeholder:text-ink-muted/60"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="font-mono text-[0.65rem] uppercase text-ink-muted/70">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="h-10 border-ink/10 bg-cream/50 rounded-sm font-mono text-[0.85rem] text-ink placeholder:text-ink-muted/60"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="font-mono text-[0.65rem] uppercase text-ink-muted/70">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            className="h-10 border-ink/10 bg-cream/50 rounded-sm font-mono text-[0.85rem] text-ink placeholder:text-ink-muted/60"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="font-mono text-[0.65rem] uppercase text-ink-muted/70">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-10 border-ink/10 bg-cream/50 rounded-sm font-mono text-[0.85rem] text-ink placeholder:text-ink-muted/60"
          />
        </div>
        <Button
          type="submit"
          className="w-full mt-2 font-mono text-[0.72rem] uppercase tracking-editorial h-11 bg-mauve text-cream hover:bg-dusty-rose transition-colors"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner /> : 'Create Account'}
        </Button>
      </form>
    </div>
  )
}
