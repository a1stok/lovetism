import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Home, BookOpen, Heart, User, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLocation, Link } from '@tanstack/react-router'
import { animate } from '@/animations'
import { useAuth } from '@/features/auth/context/use-auth'

interface AppSidebarProps {
  isOpen: boolean
}

// Primary navigation items with icons
const primaryNavigation = [
  { name: 'Journal', href: '/journal', icon: BookOpen },
  { name: 'Date Ideas', href: '/date-ideas', icon: Heart },
  { name: 'Profile', href: '/profile', icon: User },
]

// Contextual navigation types
export interface ContextualNavItem {
  name: string
  href: string
  icon: LucideIcon
}

interface RouteContext {
  title: string
  items: ContextualNavItem[]
}

export const routeContextMap: Record<string, RouteContext> = {}

export function AppSidebar({ isOpen }: AppSidebarProps) {
  const { signOut } = useAuth()
  const location = useLocation()
  const currentPath = location.pathname
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Track when expansion animation should run
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const prevIsExpanded = useRef(isExpanded)
  
  // Refs for animation targets
  const lovetismRef = useRef<HTMLAnchorElement>(null)
  const navLabelsRef = useRef<HTMLSpanElement[]>([])
  const contextualLabelsRef = useRef<HTMLSpanElement[]>([])
  const homeLabelRef = useRef<HTMLSpanElement>(null)
  
  // Get route context - try exact match first, then check if path starts with any key
  let routeContext = routeContextMap[currentPath]
  
  if (!routeContext) {
    // Find the first key that the current path starts with
    const matchingKey = Object.keys(routeContextMap).find(key => 
      key !== '/' && currentPath.startsWith(key)
    )
    if (matchingKey) {
      routeContext = routeContextMap[matchingKey]
    }
  }
  
  // Clear contextual refs when route changes
  useEffect(() => {
    contextualLabelsRef.current = []
  }, [currentPath])
  
  // Ensure visibility of contextual items when expanded and not animating
  useEffect(() => {
    if (isExpanded && !shouldAnimate) {
      // Small delay to allow DOM to update
      const timer = setTimeout(() => {
        // Ensure all text elements are visible
        if (lovetismRef.current) {
          lovetismRef.current.style.opacity = '1'
          lovetismRef.current.style.transform = ''
        }
        navLabelsRef.current.forEach(el => {
          if (el) {
            el.style.opacity = '1'
            el.style.transform = ''
          }
        })
        contextualLabelsRef.current.forEach(el => {
          if (el) {
            el.style.opacity = '1'
            el.style.transform = ''
          }
        })
        if (homeLabelRef.current) {
          homeLabelRef.current.style.opacity = '1'
          homeLabelRef.current.style.transform = ''
        }
      }, 50)
      
      return () => clearTimeout(timer)
    }
    return undefined
  }, [currentPath, isExpanded, shouldAnimate, routeContext])

  // Trigger animation only when transitioning from collapsed to expanded
  useEffect(() => {
    if (!prevIsExpanded.current && isExpanded) {
      setShouldAnimate(true)
    }
    prevIsExpanded.current = isExpanded
  }, [isExpanded])

  // Run animation when shouldAnimate is true
  useEffect(() => {
    if (!shouldAnimate || !isExpanded) return

    const targets: HTMLElement[] = []

    // Collect all text elements to animate
    if (lovetismRef.current) targets.push(lovetismRef.current)
    navLabelsRef.current.forEach(el => {
      if (el) targets.push(el)
    })
    contextualLabelsRef.current.forEach(el => {
      if (el) targets.push(el)
    })
    if (homeLabelRef.current) targets.push(homeLabelRef.current)

    if (targets.length > 0) {
      // Set initial hidden state
      targets.forEach(el => {
        el.style.opacity = '0'
        el.style.transform = 'translateX(-15px)'
      })

      // Animate to visible state
      animate(targets, {
        translateX: 0,
        opacity: 1,
        duration: 250,
        delay: (_target, i: number) => i * 30,
        easing: 'easeOutQuart',
        complete: () => {
          // Clean up inline styles after animation
          targets.forEach(el => {
            el.style.opacity = ''
            el.style.transform = ''
          })
          setShouldAnimate(false)
        }
      })
    }
  }, [shouldAnimate, isExpanded])

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 transform bg-background border-r transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: controlled expansion
          isExpanded ? 'lg:w-64' : 'lg:w-16',
        )}
      >
        {/* Identity Header */}
        <div className="flex h-16 items-center gap-3 px-6 shrink-0 relative">
          {isExpanded ? (
            <>
              <Button
                variant="ghost"
                className="px-0 h-auto font-semibold text-lg hover:bg-transparent"
                asChild
              >
                <Link 
                  to="/"
                  ref={lovetismRef}
                >
                  Lovetism
                </Link>
              </Button>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Collapse sidebar</span>
              </Button>
            </>
          ) : (
            <div className="w-full flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsExpanded(true)}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Expand sidebar</span>
              </Button>
            </div>
          )}
        </div>

        {/* Primary Navigation - Always visible */}
        <nav className="space-y-1 px-3 py-4 shrink-0">
          {primaryNavigation.map((item, index) => {
            const Icon = item.icon
            const isActive = currentPath === item.href || 
                            (item.href !== '/' && currentPath.startsWith(item.href))
            return (
              <div key={item.name} className="relative group">
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full font-normal transition-all',
                    isExpanded ? 'justify-start' : 'justify-center px-0'
                  )}
                  asChild
                >
                  <Link to={item.href}>
                    <Icon className={cn('h-4 w-4 shrink-0', isExpanded && 'mr-3')} />
                    {isExpanded && (
                      <span
                        ref={(el) => {
                          if (el) navLabelsRef.current[index] = el
                        }}
                      >
                        {item.name}
                      </span>
                    )}
                  </Link>
                </Button>
                {!isExpanded && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                      {item.name}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Contextual Navigation - Only show when expanded */}
        {isExpanded && routeContext && (
          <div className="flex-1 px-3 py-4 overflow-y-auto min-h-0 border-t">
            <h3 className="mb-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {routeContext.title}
            </h3>
            <nav className="space-y-1">
              {routeContext.items.map((item, index) => {
                const Icon = item.icon
                const isActive = currentPath === item.href
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="w-full font-normal justify-start"
                    asChild
                  >
                    <Link to={item.href}>
                      <Icon className="mr-3 h-4 w-4 shrink-0" />
                      <span
                        ref={(el) => {
                          if (el) contextualLabelsRef.current[index] = el
                        }}
                      >
                        {item.name}
                      </span>
                    </Link>
                  </Button>
                )
              })}
            </nav>
          </div>
        )}

        {/* Home & Logout Link at Bottom - Only show when expanded */}
        {isExpanded && (
          <div className="mt-auto px-3 py-4 shrink-0 border-t space-y-1">
            <Button
              variant="ghost"
              className="w-full font-normal text-muted-foreground justify-start"
              asChild
            >
              <Link to="/">
                <Home className="mr-3 h-4 w-4 shrink-0" />
                <span ref={homeLabelRef}>Home</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full font-normal text-red-500 hover:text-red-600 hover:bg-red-50 justify-start"
              onClick={() => signOut()}
            >
              <LogOut className="mr-3 h-4 w-4 shrink-0" />
              <span>Logout</span>
            </Button>
          </div>
        )}
      </aside>
    </>
  )
}