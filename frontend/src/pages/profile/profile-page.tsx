import { ProfileForm } from './components/profile-form'

export function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-4xl lg:text-5xl text-ink font-light tracking-tight">
          Your Profile
        </h1>
        <p className="font-mono text-[0.7rem] uppercase tracking-widest text-ink-muted/70">
          Manage your identity and preferences
        </p>
      </div>
      
      {/* Content */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-ink/5 p-6 md:p-10 shadow-sm">
        <ProfileForm />
      </div>
    </div>
  )
}

