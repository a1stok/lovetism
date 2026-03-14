import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'
import { ResetPasswordForm } from './reset-password-form'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultTab?: 'login' | 'register' | 'reset'
}

/**
 * AuthModal acts as the orchestrator for the login/registration flow.
 * SRP: It only handles visibility and switching between forms.
 */
export function AuthModal({ isOpen, onClose, onSuccess, defaultTab = 'login' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'reset'>(defaultTab)

  // Sync activeTab if parent changes defaultTab (e.g. re-opening modal on a different tab)
  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  const titles = {
    login: 'Welcome Back',
    register: 'Join Lovetism',
    reset: 'Reset Password'
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden border-none bg-transparent">
        <div className="flex h-[550px] w-full overflow-hidden rounded-xl bg-[var(--cream)] shadow-2xl">
          {/* Visual Side */}
          <div className="hidden md:flex md:w-[45%] relative overflow-hidden bg-ink">
            <img
              src="/images/auth/modal-bg.jpg"
              alt="Auth Background"
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
            <div className="absolute bottom-8 left-8 right-8 z-10 text-white text-center md:text-left">
              <p className="font-serif italic text-2xl mb-2">Lovetism</p>
              <p className="font-mono text-[0.7rem] uppercase tracking-widest text-white/70">
                {activeTab === 'reset' ? "We'll get you back in" : 'Your journey together starts here'}
              </p>
            </div>
          </div>

          {/* Form Side */}
          <div className="flex-1 flex flex-col justify-center p-8 md:p-12">
            <DialogHeader className="mb-6">
              <DialogTitle className="font-serif text-3xl font-light text-ink">
                {titles[activeTab]}
              </DialogTitle>
              <p className="text-[0.8rem] font-mono text-ink-muted/70 mt-2 uppercase tracking-tight">
                {activeTab === 'reset' ? 'Authentication Recovery' : 'Making relationships beautiful'}
              </p>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'login' | 'register' | 'reset')} className="w-full">
              {activeTab !== 'reset' && (
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-ink/5 p-1 rounded-sm">
                  <TabsTrigger value="login" className="font-mono text-[0.7rem] uppercase tracking-editorial h-8">
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="register" className="font-mono text-[0.7rem] uppercase tracking-editorial h-8">
                    Register
                  </TabsTrigger>
                </TabsList>
              )}

              {activeTab === 'login' && (
                <LoginForm onSuccess={() => { onSuccess?.(); onClose(); }} onForgotPassword={() => setActiveTab('reset')} />
              )}
              {activeTab === 'register' && (
                <RegisterForm onSuccess={() => { onSuccess?.(); onClose(); }} />
              )}
              {activeTab === 'reset' && (
                <ResetPasswordForm onBack={() => setActiveTab('login')} />
              )}
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
