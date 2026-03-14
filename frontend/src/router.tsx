import { AppLayout } from '@/components/layout/app-layout'
import { routeContextMap } from '@/components/layout/app-sidebar'
import { useEffect } from 'react'
import { useAuth } from '@/features/auth/context/use-auth'
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useNavigate,
} from '@tanstack/react-router'
import {
  BookOpen,
  Calendar,
  Heart,
  Sparkles,
  MapPin,
  User,
  Settings,
  Bell,
} from 'lucide-react'

// Pages
import { LandingPage } from '@/pages/landing/landing-page'
import { JournalPage } from '@/pages/journal/journal-page'
import { JournalDetailPage } from '@/pages/journal/journal-detail-page'
import { DateIdeasPage } from '@/pages/date-ideas/date-ideas-page'
import { ProfilePage } from '@/pages/profile/profile-page'

// Auth features
import { ProtectedRoute, UpdatePasswordForm } from '@/features/auth'

// Configure contextual navigation for app routes
routeContextMap['/journal'] = {
  title: 'Journal',
  items: [
    { name: 'All Entries', href: '/journal', icon: BookOpen },
  ],
}

routeContextMap['/date-ideas'] = {
  title: 'Date Ideas',
  items: [
    { name: 'Discover', href: '/date-ideas/discover', icon: Sparkles },
    { name: 'Favorites', href: '/date-ideas/favorites', icon: Heart },
    { name: 'Planned', href: '/date-ideas/planned', icon: Calendar },
    { name: 'Near Me', href: '/date-ideas/nearby', icon: MapPin },
  ],
}

routeContextMap['/profile'] = {
  title: 'Profile',
  items: [
    { name: 'My Profile', href: '/profile/me', icon: User },
    { name: 'Partner', href: '/profile/partner', icon: Heart },
    { name: 'Preferences', href: '/profile/preferences', icon: Settings },
    { name: 'Notifications', href: '/profile/notifications', icon: Bell },
  ],
}

// Root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

// Landing page (marketing)
const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
})

// Password Reset Page
const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/reset-password',
  component: () => (
    <div className="min-h-screen flex items-center justify-center bg-[var(--cream)] p-4">
      <UpdatePasswordForm />
    </div>
  ),
})

// App layout (authenticated)
const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: () => (
    <ProtectedRoute>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProtectedRoute>
  ),
})

// App routes
const journalRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/journal',
  component: JournalPage,
})

const journalDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/journal/$journalId',
  component: JournalDetailPage,
})

const dateIdeasRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/date-ideas',
  component: DateIdeasPage,
})

const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/profile',
  component: ProfilePage,
})

const CatchAllComponent = () => {
  const { session, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading) {
      if (session) {
        void navigate({ to: '/journal', replace: true })
      } else {
        void navigate({ to: '/', replace: true })
      }
    }
  }, [session, isLoading, navigate])

  return null
}

// 404/Catch-all handling
const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '$',
  component: CatchAllComponent
})

// Route tree
const routeTree = rootRoute.addChildren([
  landingRoute,
  resetPasswordRoute,
  appLayoutRoute.addChildren([
    journalRoute,
    journalDetailRoute,
    dateIdeasRoute,
    profileRoute,
  ]),
  catchAllRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}