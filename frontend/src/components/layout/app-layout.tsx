import { useState, type ReactNode } from 'react'
import { useLocation } from '@tanstack/react-router'
import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar isOpen={sidebarOpen} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto">
          <div
            key={location.pathname}
            className="container mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-[350ms] ease-out"
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}