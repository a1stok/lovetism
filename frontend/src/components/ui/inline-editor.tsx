import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef } from 'react'

interface InlineEditorProps {
  value: string
  onSave: (value: string) => void
  onCancel: () => void
  className?: string
}

export function InlineEditor({ value, onSave, onCancel, className }: InlineEditorProps) {
  const cancelRequestedRef = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // We only want plain text behavior for a title
        heading: false,
        bulletList: false,
        orderedList: false,
        codeBlock: false,
        blockquote: false,
      }),
    ],
    content: value,
    autofocus: 'end',
    editorProps: {
      attributes: {
        class: 'outline-none border-none ring-0 focus:ring-0 focus:outline-none',
        spellcheck: 'false',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          onSave(view.state.doc.textContent)
          return true
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          cancelRequestedRef.current = true
          onCancel()
          return true
        }
        return false
      },
      handleDOMEvents: {
        blur: (view) => {
          if (cancelRequestedRef.current) {
            cancelRequestedRef.current = false
            return
          }
          const text = view.state.doc.textContent.trim()
          if (text) onSave(text)
        },
      },
    },
  })

  // Update content if value changes externally (e.g. after switching to another item)
  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getText()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  return (
    <div className={className}>
      <EditorContent editor={editor} />
    </div>
  )
}
