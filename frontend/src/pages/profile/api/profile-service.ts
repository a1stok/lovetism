import { supabase } from '@/lib/supabase'
import type { Profile } from '@/features/auth'
import imageCompression from 'browser-image-compression'

export const ProfileService = {
  async updateProfile(userId: string, updates: Partial<Omit<Profile, 'id' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data as Profile
  },

  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop()
    const filePath = `${userId}/avatar.${fileExt}`

    // Compress image before upload
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    })

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, compressedFile, { upsert: true })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Update profile record
    return this.updateProfile(userId, { avatar_url: publicUrl })
  }
}
