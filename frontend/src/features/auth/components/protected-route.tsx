import { useNavigate, Outlet } from '@tanstack/react-router'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuth } from '../context/use-auth'

interface ProtectedRouteProps {
  children?: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, isLoading } = useAuth()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--cream)] gap-3">
        <LoadingSpinner className="h-8 w-8 animate-spin text-mauve" />
        <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-muted/40">Checking session…</p>
      </div>
    )
  }

  // Session resolved but user isn't logged in — redirect immediately.
  // Using replace: true avoids polluting the browser history stack.
  if (!session) {
    void navigate({ to: '/', replace: true })
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--cream)] gap-3">
        <LoadingSpinner className="h-8 w-8 animate-spin text-mauve" />
        <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-muted/40">Redirecting…</p>
      </div>
    )
  }

  return <>{children || <Outlet />}</>
}
