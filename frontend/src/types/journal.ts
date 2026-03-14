export interface JournalItem {
  id: string
  type: 'folder' | 'file'
  name: string
  content?: Record<string, any> | null // Tiptap JSON object
  items?: JournalItem[] // Children for folders
}

/** Raw row from the `journals` Supabase table */
export interface JournalRow {
  id: string
  user_id: string
  name: string
  background_image: string | null
  created_at: string
}

/** Journal with computed tree of nodes (used by the UI) */
export interface Journal extends JournalRow {
  items?: JournalItem[]
}
