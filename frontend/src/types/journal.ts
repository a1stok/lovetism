export type TiptapJson = Record<string, unknown>

export interface JournalItem {
  id: string
  type: 'folder' | 'file'
  name: string
  content?: TiptapJson | null
  items?: JournalItem[]
}

/** Raw row from the `journals` Supabase table */
export interface JournalRow {
  id: string
  user_id: string
  name: string
  background_image: string | null
  visibility?: 'private' | 'partner'
  created_at: string
}

/** Journal with computed tree of nodes (used by the UI) */
export interface Journal extends JournalRow {
  items?: JournalItem[]
}
