import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps extends React.ComponentProps<typeof Loader2> {}

/**
 * Reusable LoadingSpinner component following SRP.
 * It's just a spinner that accepts standard Lucide props and Tailwind classes.
 */
export function LoadingSpinner({ className, ...props }: LoadingSpinnerProps) {
  return (
    <Loader2 
      className={cn("h-4 w-4 animate-spin", className)} 
      {...props} 
    />
  )
}
