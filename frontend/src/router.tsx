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
  Heart,
  User,
} from 'lucide-react'

// Pages
import { LandingPage } from '@/pages/landing/landing-page'
import { JournalPage } from '@/pages/journal/journal-page'
import { JournalDetailPage } from '@/pages/journal/journal-detail-page'
import { DateIdeasPage } from '@/pages/date-ideas/date-ideas-page'
import { ProfileLayout } from '@/pages/profile/profile-layout'
import { ProfileForm } from '@/pages/profile/components/profile-form'
import { PartnerPage } from '@/pages/profile/partner-page'

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
  items: [],
}

routeContextMap['/profile'] = {
  title: 'Profile',
  items: [
    { name: 'My Profile', href: '/profile/me', icon: User },
    { name: 'Partner', href: '/profile/partner', icon: Heart },
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
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
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

const profileLayoutRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/profile',
  component: ProfileLayout,
})

const profileIndexRoute = createRoute({
  getParentRoute: () => profileLayoutRoute,
  path: '/',
  component: () => (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-4xl lg:text-5xl text-ink font-light tracking-tight">Your Profile</h1>
        <p className="font-mono text-[0.7rem] uppercase tracking-widest text-ink-muted/70">Manage your identity and preferences</p>
      </div>
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-ink/5 p-6 md:p-10 shadow-sm">
        <ProfileForm />
      </div>
    </div>
  ),
})

const profilePartnerRoute = createRoute({
  getParentRoute: () => profileLayoutRoute,
  path: '/partner',
  component: PartnerPage,
})

const profileMeRoute = createRoute({
  getParentRoute: () => profileLayoutRoute,
  path: '/me',
  component: () => (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-4xl lg:text-5xl text-ink font-light tracking-tight">My Profile</h1>
        <p className="font-mono text-[0.7rem] uppercase tracking-widest text-ink-muted/70">Manage your identity</p>
      </div>
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-ink/5 p-6 md:p-10 shadow-sm">
        <ProfileForm />
      </div>
    </div>
  ),
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
    profileLayoutRoute.addChildren([
      profileIndexRoute,
      profileMeRoute,
      profilePartnerRoute,
    ]),
  ]),
  catchAllRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}