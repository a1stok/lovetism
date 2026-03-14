import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { UserPlus, Check, Loader2, Trash2 } from 'lucide-react'
import { getApiErrorMessage } from '@/core/api/client'
import { PartnershipService, getPartnerDisplayName, type Partnership } from '@/core/api/partnership-service'

export function PartnerPage() {
  const [partnerships, setPartnerships] = useState<Partnership[]>([])
  const [nickname, setNickname] = useState('')
  const [inviting, setInviting] = useState(false)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadPartnerships = () => {
    PartnershipService.list()
      .then((r) => setPartnerships(r.partnerships))
      .catch(() => setPartnerships([]))
  }

  useEffect(() => {
    loadPartnerships()
  }, [])

  const handleInvite = async () => {
    if (!nickname.trim()) return
    setInviting(true)
    setError(null)
    try {
      await PartnershipService.invite(nickname.trim())
      loadPartnerships()
      setNickname('')
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Invite failed'))
    } finally {
      setInviting(false)
    }
  }

  const handleAccept = async (id: string) => {
    setAcceptingId(id)
    try {
      await PartnershipService.accept(id)
      loadPartnerships()
    } finally {
      setAcceptingId(null)
    }
  }

  const handleRemove = async (id: string) => {
    setRemovingId(id)
    try {
      await PartnershipService.remove(id)
      loadPartnerships()
    } finally {
      setRemovingId(null)
    }
  }

  const activePartners = partnerships.filter((p) => p.status === 'active')
  const pendingReceived = partnerships.filter((p) => p.status === 'pending' && !p.isInviter)
  const pendingSent = partnerships.filter((p) => p.status === 'pending' && p.isInviter)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl lg:text-5xl text-ink font-light tracking-tight">Partner</h1>
        <p className="font-mono text-[0.7rem] uppercase tracking-widest text-ink-muted/70 mt-2">
          Set your nickname in My Profile. Add partners by nickname below.
        </p>
      </div>

      <Card className="border-ink/5">
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label className="font-mono text-[0.65rem] uppercase text-ink-muted">Add partner by nickname</Label>
            <div className="flex gap-2 flex-wrap items-center">
              <Input
                placeholder="Partner nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleInvite()
                  }
                }}
                className="max-w-xs input-editorial"
              />
              <Button onClick={handleInvite} disabled={inviting || !nickname.trim()} className="bg-mauve text-cream hover:bg-dusty-rose">
                {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                <span className="ml-2">Add</span>
              </Button>
            </div>
            {error && <p className="font-mono text-xs text-red-600">{error}</p>}
          </div>

          {pendingReceived.length > 0 && (
            <div className="space-y-2">
              <Label className="font-mono text-[0.65rem] uppercase text-ink-muted">Pending invites</Label>
              <div className="space-y-2">
                {pendingReceived.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-4 py-2 border-b border-ink/5 last:border-0">
                    <span className="text-ink text-sm">{getPartnerDisplayName(p)}</span>
                    <Button size="sm" variant="outline" onClick={() => handleAccept(p.id)} disabled={!!acceptingId} className="border-ink/10">
                      {acceptingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      <span className="ml-2">Accept</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePartners.length > 0 && (
            <div className="space-y-2">
              <Label className="font-mono text-[0.65rem] uppercase text-ink-muted">Partners</Label>
              <div className="space-y-2">
                {activePartners.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-4 py-2 border-b border-ink/5 last:border-0">
                    <span className="text-ink text-sm">{getPartnerDisplayName(p)}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemove(p.id)}
                      disabled={!!removingId}
                      className="text-ink-muted hover:text-red-500 text-[0.65rem] font-mono"
                    >
                      {removingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      <span className="ml-2">Remove</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingSent.length > 0 && (
            <div className="space-y-2">
              <Label className="font-mono text-[0.65rem] uppercase text-ink-muted">Sent (awaiting response)</Label>
              <div className="space-y-2">
                {pendingSent.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-4 py-2 border-b border-ink/5 last:border-0">
                    <span className="text-ink-muted text-sm">{getPartnerDisplayName(p)}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleRemove(p.id)} disabled={!!removingId} className="text-ink-muted text-[0.65rem] font-mono">
                      {removingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Cancel'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePartners.length === 0 && pendingReceived.length === 0 && pendingSent.length === 0 && (
            <p className="font-mono text-[0.75rem] text-ink-muted/70">No partners yet. Add one by nickname above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
