import { supabase } from '@/lib/supabase'
import type { JournalItem, JournalRow } from '@/types/journal'
import imageCompression from 'browser-image-compression'

export const JournalService = {
  async fetchJournals(): Promise<JournalRow[]> {
    const { data, error } = await supabase
      .from('journals')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as JournalRow[]
  },

  async createJournal(name: string, userId: string): Promise<JournalRow> {
    const { data, error } = await supabase
      .from('journals')
      .insert({ name, user_id: userId })
      .select()
      .single()

    if (error) throw error
    return data as JournalRow
  },

  async fetchJournalWithNodes(journalId: string): Promise<{ journal: JournalRow; items: JournalItem[] }> {
    const [journalResult, nodesResult] = await Promise.all([
      supabase.from('journals').select('*').eq('id', journalId).single(),
      supabase.from('nodes').select('*').eq('journal_id', journalId).order('position'),
    ])

    if (journalResult.error) throw journalResult.error
    if (nodesResult.error) throw nodesResult.error

    const items = buildTree(nodesResult.data)
    return { journal: journalResult.data as JournalRow, items }
  },

  async createNode(journalId: string, node: {
    parent_id: string | null
    type: 'file' | 'folder'
    name: string
    content?: object | null
    position?: number
  }) {
    const { data, error } = await supabase
      .from('nodes')
      .insert({ journal_id: journalId, ...node })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateNode(nodeId: string, updates: {
    name?: string
    content?: object | null
    position?: number
  }) {
    const { data, error } = await supabase
      .from('nodes')
      .update(updates)
      .eq('id', nodeId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteNode(nodeId: string) {
    const { error } = await supabase
      .from('nodes')
      .delete()
      .eq('id', nodeId)

    if (error) throw error
  },

  async updateJournal(journalId: string, updates: { name?: string; background_image?: string | null }): Promise<JournalRow> {
    const { data, error } = await supabase
      .from('journals')
      .update(updates)
      .eq('id', journalId)
      .select()
      .single()

    if (error) throw error
    return data as JournalRow
  },

  async uploadCoverImage(journalId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const filePath = `journal-covers/${journalId}.${fileExt}`

    // Compress image before upload
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    })

    const { error: uploadError } = await supabase.storage
      .from('journal-assets')
      .upload(filePath, compressedFile, { upsert: true })

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('journal-assets')
      .getPublicUrl(filePath)

    // Update the journal row with the public URL
    await supabase
      .from('journals')
      .update({ background_image: data.publicUrl })
      .eq('id', journalId)

    return data.publicUrl
  },

  /**
   * Compress and upload an image to be embedded inline in the TipTap editor.
   * Uploads to journal-assets/[userId]/inline/[timestamp]-[filename]
   */
  async uploadInlineImage(userId: string, file: File): Promise<string> {
    try {
      // Compress the image (max 1MB, 1920px width/height)
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      })

      const fileExt = compressedFile.name.split('.').pop()
      const fileName = `${userId}/inline/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('journal-assets')
        .upload(fileName, compressedFile, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('journal-assets')
        .getPublicUrl(fileName)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading inline image:', error)
      throw error
    }
  },

  async deleteJournal(journalId: string): Promise<void> {
    const { error } = await supabase
      .from('journals')
      .delete()
      .eq('id', journalId)

    if (error) throw error
  },
}

interface NodeRow {
  id: string
  journal_id: string
  parent_id: string | null
  type: 'folder' | 'file'
  name: string
  content: object | null
  position: number
  created_at: string
}

/**
 * Convert flat node rows (with parent_id) into a nested JournalItem tree.
 */
function buildTree(rows: NodeRow[]): JournalItem[] {
  const map = new Map<string, JournalItem>()
  const roots: JournalItem[] = []

  // First pass: create all items
  for (const row of rows) {
    map.set(row.id, {
      id: row.id,
      type: row.type,
      name: row.name,
      content: row.type === 'file' ? (row.content as Record<string, any>) : undefined,
      items: row.type === 'folder' ? [] : undefined,
    })
  }

  // Second pass: link children to parents
  for (const row of rows) {
    const item = map.get(row.id)!
    if (row.parent_id && map.has(row.parent_id)) {
      map.get(row.parent_id)!.items!.push(item)
    } else {
      roots.push(item)
    }
  }

  return roots
}
