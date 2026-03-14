import { apiClient } from './client'

export interface PartnershipPartner {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
  displayName?: string
}

export interface Partnership {
  id: string
  partnerId: string
  partner: PartnershipPartner | null
  status: 'pending' | 'active'
  isInviter: boolean
  created_at: string
}

export function getPartnerDisplayName(p: Partnership): string {
  return p.partner?.displayName ?? p.partner?.first_name ?? 'Partner'
}

export const PartnershipService = {
  async list(): Promise<{ partnerships: Partnership[] }> {
    return apiClient.get('/api/partnerships')
  },

  async invite(nickname: string): Promise<unknown> {
    return apiClient.post('/api/partnerships/invite', { nickname })
  },

  async accept(id: string): Promise<unknown> {
    return apiClient.post(`/api/partnerships/${id}/accept`)
  },

  async remove(id: string): Promise<void> {
    return apiClient.delete(`/api/partnerships/${id}`)
  },
}
