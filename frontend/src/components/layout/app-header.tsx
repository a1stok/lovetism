import { Button } from '@/components/ui/button'
import { useTheme } from '@/core/providers/theme-provider'
import { Moon, Sun, Menu } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'

interface AppHeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: Dispatch<SetStateAction<boolean>>
}

export function AppHeader({ setSidebarOpen }: AppHeaderProps) {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <header className="sticky top-0 z-40 bg-background h-16 flex items-center">
      <div className="flex w-full h-full items-center justify-between gap-4 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={() => setSidebarOpen((open) => !open)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={toggleTheme}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  )
}