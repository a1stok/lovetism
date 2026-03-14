import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AuthService } from '../api/auth-service'

interface LoginFormProps {
  onSuccess: () => void
  onForgotPassword: () => void
}

export function LoginForm({ onSuccess, onForgotPassword }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await AuthService.login({ email, password })
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid login credentials')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 text-ink">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-sm">
          <p className="text-[0.7rem] font-mono text-red-600 uppercase tracking-tight">{error}</p>
        </div>
      )}

      <Button 
        variant="outline" 
        type="button"
        onClick={async () => {
          try {
            await AuthService.signInWithGoogle()
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to sign in with Google')
          }
        }}
        className="w-full font-mono text-[0.72rem] uppercase tracking-editorial h-11 border-ink/10 text-ink hover:bg-ink hover:text-cream transition-colors gap-3"
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-ink/10" />
        </div>
        <div className="relative flex justify-center text-[0.65rem] uppercase font-mono">
          <span className="bg-cream px-3 text-ink-muted/40">Or email</span>
        </div>
      </div>

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
            className="h-10 border-ink/10 bg-cream/50 rounded-sm font-mono text-[0.85rem] text-ink placeholder:text-ink-muted/60"
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password" className="font-mono text-[0.65rem] uppercase text-ink-muted/70">Password</Label>
            <button 
              type="button" 
              onClick={onForgotPassword}
              className="text-[0.6rem] font-mono uppercase text-mauve hover:text-dusty-rose transition-colors"
            >
              Forgot?
            </button>
          </div>
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
          {isLoading ? <LoadingSpinner /> : 'Sign In'}
        </Button>
      </form>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}
