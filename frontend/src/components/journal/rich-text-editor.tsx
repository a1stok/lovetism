import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Quote,
    Heading1,
    Heading2,
    Code,
    Undo,
    Redo,
    Type,
    Link as LinkIcon,
    Highlighter,
    AlignLeft,
    AlignCenter,
    AlignRight,
    CheckSquare,
    Image as ImageIcon,
    Loader2,
    MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { JournalService } from '@/pages/journal/api/journal-service'
import { useAuth } from '@/features/auth/context/use-auth'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { LocationPicker } from './location-picker'
import type { TiptapJson } from '@/types/journal'

interface RichTextEditorProps {
    content: TiptapJson | null
    onChange?: (content: TiptapJson) => void
    className?: string
}

const ToolbarButton = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<'button'> & {
        isActive?: boolean
        tooltip: string
    }
>(({ isActive, children, tooltip, className, ...props }, ref) => (
    <button
        ref={ref}
        type="button"
        className={cn(
            "h-8 w-8 p-0 rounded-md flex items-center justify-center transition-all duration-200 hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary/20",
            isActive && "bg-muted text-primary font-bold shadow-sm",
            className
        )}
        title={tooltip}
        {...props}
    >
        {children}
    </button>
))
ToolbarButton.displayName = 'ToolbarButton'

export function RichTextEditor({
    content,
    onChange,
    className,
}: RichTextEditorProps) {
    const { user } = useAuth()
    const [isUploading, setIsUploading] = React.useState(false)
    const [isLocationOpen, setIsLocationOpen] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleImageUpload = async (file: File) => {
        if (!user) return
        try {
            setIsUploading(true)
            const url = await JournalService.uploadInlineImage(user.id, file)
            editor?.chain().focus().setImage({ src: url }).run()
        } catch (error) {
            console.error('Failed to upload image:', error)
            alert('Failed to upload image. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                // Disable extensions that we add manually to avoid duplicates
                // In TipTap 3.x StarterKit might already include these.
                // @ts-ignore - these keys might not exist in all StarterKit versions
                link: false,
                // @ts-ignore
                underline: false,
            }),
            Placeholder.configure({
                placeholder: 'Start writing your thoughts...',
                emptyEditorClass: 'is-editor-empty',
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: 'https',
                HTMLAttributes: {
                    class: 'text-primary cursor-text hover:underline decoration-primary/30 underline-offset-4 transition-all duration-200',
                },
            }),
            Image,
            Highlight.configure({ multicolor: true }),
            Typography,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
        ],
        content,
        // editable is true by default
        editorProps: {
            attributes: {
                class: 'prose prose-slate max-w-none focus:outline-none min-h-[500px] px-12 py-10 selection:bg-primary/20',
                spellcheck: 'false',
            },
            handlePaste: (_view, event) => {
                const items = Array.from(event.clipboardData?.items || [])
                const imageItem = items.find(item => item.type.startsWith('image/'))
                
                if (imageItem) {
                    event.preventDefault()
                    const file = imageItem.getAsFile()
                    if (file) {
                        handleImageUpload(file)
                    }
                    return true
                }
                return false
            },
            handleDrop: (_view, event, _slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
                    const file = event.dataTransfer.files[0]
                    if (file.type.startsWith('image/')) {
                        event.preventDefault()
                        handleImageUpload(file)
                        return true
                    }
                }
                return false
            },
            handleClick(_view, _pos, event) {
                const target = event.target as HTMLElement
                
                // Find the nearest anchor tag
                const link = target.closest('a')
                if (link && link.href) {
                    // Only open if Ctrl (Windows) or Cmd (Mac) is pressed
                    if (event.ctrlKey || event.metaKey) {
                        window.open(link.href, link.target || '_blank')
                        return true // stop propagation
                    }
                }
                return false
            }
        },
        onUpdate: ({ editor }) => {
            onChange?.(editor.getJSON())
        },
        immediatelyRender: false,
    })

    const [isModKeyPressed, setIsModKeyPressed] = React.useState(false)

    // Track if ctrl or cmd is pressed to change link cursors
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) setIsModKeyPressed(true)
        }
        const handleKeyUp = (e: KeyboardEvent) => {
            if (!e.ctrlKey && !e.metaKey) setIsModKeyPressed(false)
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [])

    // Update content when it changes externally
    useEffect(() => {
        if (editor && content) {
            const currentContent = editor.getJSON()
            // Deep compare to prevent cursor jumps
            if (JSON.stringify(content) !== JSON.stringify(currentContent)) {
                editor.commands.setContent(content, { emitUpdate: false })
            }
        }
    }, [content, editor])

    if (!editor) {
        return null
    }

    return (
        <div className={cn("relative flex flex-col w-full h-full", isModKeyPressed && "mod-key-pressed", className)}>
            {/* Elegant Main Toolbar */}
            <div className="sticky top-0 z-20 flex items-center justify-center w-full px-4 py-2 bg-white/70 backdrop-blur-xl border-b border-gray-100 transition-all duration-300">
                <div className="flex items-center gap-1 p-1 bg-gray-50/50 rounded-xl border border-gray-100/50 shadow-sm">
                    {/* History */}
                    <div className="flex items-center gap-0.5 px-1 border-r border-gray-200">
                        <ToolbarButton
                            onClick={() => editor.chain().focus().undo().run()}
                            onMouseDown={(e) => e.preventDefault()}
                            tooltip="Undo (Ctrl+Z)"
                        >
                            <Undo className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().redo().run()}
                            onMouseDown={(e) => e.preventDefault()}
                            tooltip="Redo (Ctrl+Y)"
                        >
                            <Redo className="h-4 w-4" />
                        </ToolbarButton>
                    </div>

                    {/* Block Types */}
                    <div className="flex items-center gap-0.5 px-1 border-r border-gray-200">
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            onMouseDown={(e) => e.preventDefault()}
                            isActive={editor.isActive('heading', { level: 1 })}
                            tooltip="Heading 1"
                        >
                            <Heading1 className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            onMouseDown={(e) => e.preventDefault()}
                            isActive={editor.isActive('heading', { level: 2 })}
                            tooltip="Heading 2"
                        >
                            <Heading2 className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().setParagraph().run()}
                            onMouseDown={(e) => e.preventDefault()}
                            isActive={editor.isActive('paragraph')}
                            tooltip="Normal Text"
                        >
                            <Type className="h-4 w-4" />
                        </ToolbarButton>
                    </div>

                    {/* Basic Formatting */}
                    <div className="flex items-center gap-0.5 px-1 border-r border-gray-200">
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            onMouseDown={(e) => e.preventDefault()}
                            isActive={editor.isActive('bold')}
                            tooltip="Bold (Ctrl+B)"
                        >
                            <Bold className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            onMouseDown={(e) => e.preventDefault()}
                            isActive={editor.isActive('italic')}
                            tooltip="Italic (Ctrl+I)"
                        >
                            <Italic className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            onMouseDown={(e) => e.preventDefault()}
                            isActive={editor.isActive('underline')}
                            tooltip="Underline (Ctrl+U)"
                        >
                            <UnderlineIcon className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleCode().run()}
                            onMouseDown={(e) => e.preventDefault()}
                            isActive={editor.isActive('code')}
                            tooltip="Inline Code"
                        >
                            <Code className="h-4 w-4" />
                        </ToolbarButton>
                        <Popover open={isLocationOpen} onOpenChange={setIsLocationOpen}>
                            <PopoverTrigger asChild>
                                <ToolbarButton
                                    tooltip="Insert Google Maps Location"
                                >
                                    <MapPin className="h-4 w-4" />
                                </ToolbarButton>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0 border-none bg-transparent shadow-none" align="start" sideOffset={8}>
                                <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                    <LocationPicker 
                                        onSelect={(place) => {
                                            if (editor) {
                                                editor
                                                    .chain()
                                                    .focus()
                                                    .insertContent(`<a href="${place.url}" target="_blank" class="location-link font-medium inline-flex items-center gap-1 transition-all hover:text-primary hover:underline cursor-text">${place.name}</a> `)
                                                    .run()
                                                setIsLocationOpen(false)
                                            }
                                        }} 
                                    />
                                </div>
                            </PopoverContent>
                        </Popover>
                        <ToolbarButton
                            onClick={() => fileInputRef.current?.click()}
                            tooltip="Insert Image"
                        >
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin text-mauve" /> : <ImageIcon className="h-4 w-4" />}
                        </ToolbarButton>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleImageUpload(file)
                                if (fileInputRef.current) fileInputRef.current.value = ''
                            }}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    {/* Lists & Blocks */}
                    <div className="flex items-center gap-0.5 px-1 border-r border-gray-200">
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            isActive={editor.isActive('bulletList')}
                            tooltip="Bullet List"
                        >
                            <List className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            isActive={editor.isActive('orderedList')}
                            tooltip="Ordered List"
                        >
                            <ListOrdered className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleTaskList().run()}
                            isActive={editor.isActive('taskList')}
                            tooltip="Task List"
                        >
                            <CheckSquare className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            isActive={editor.isActive('blockquote')}
                            tooltip="Blockquote"
                        >
                            <Quote className="h-4 w-4" />
                        </ToolbarButton>
                    </div>

                    {/* Alignment */}
                    <div className="flex items-center gap-0.5 px-1">
                        <ToolbarButton
                            onClick={() => editor.chain().focus().setTextAlign('left').run()}
                            isActive={editor.isActive({ textAlign: 'left' })}
                            tooltip="Align Left"
                        >
                            <AlignLeft className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().setTextAlign('center').run()}
                            isActive={editor.isActive({ textAlign: 'center' })}
                            tooltip="Align Center"
                        >
                            <AlignCenter className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().setTextAlign('right').run()}
                            isActive={editor.isActive({ textAlign: 'right' })}
                            tooltip="Align Right"
                        >
                            <AlignRight className="h-4 w-4" />
                        </ToolbarButton>
                    </div>
                </div>
            </div>

            {/* Bubble Menu - Modern Styling */}
            <BubbleMenu
                editor={editor}
                className="flex items-center gap-0.5 p-1 bg-white/90 backdrop-blur-md rounded-lg border border-gray-200 shadow-xl"
            >
                <div className="flex items-center gap-0.5">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        tooltip="Bold"
                    >
                        <Bold className="h-3.5 w-3.5" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        tooltip="Italic"
                    >
                        <Italic className="h-3.5 w-3.5" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        isActive={editor.isActive('underline')}
                        tooltip="Underline"
                    >
                        <UnderlineIcon className="h-3.5 w-3.5" />
                    </ToolbarButton>
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        isActive={editor.isActive('highlight')}
                        tooltip="Highlight"
                    >
                        <Highlighter className="h-3.5 w-3.5" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => {
                            const url = window.prompt('URL')
                            if (url) {
                                editor.chain().focus().setLink({ href: url }).run()
                            }
                        }}
                        isActive={editor.isActive('link')}
                        tooltip="Link"
                    >
                        <LinkIcon className="h-3.5 w-3.5" />
                    </ToolbarButton>
                </div>
            </BubbleMenu>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto custom-scrollbar">
                <EditorContent editor={editor} className="min-h-full" />
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #adb5bd;
                    pointer-events: none;
                    height: 0;
                }
                .ProseMirror:focus {
                    outline: none;
                }
                .prose pre {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 1rem;
                    border: 1px solid #e9ecef;
                }
                .prose blockquote {
                    border-left: 4px solid #e9ecef;
                    padding-left: 1rem;
                    font-style: italic;
                    color: #495057;
                }
                /* Task lists */
                ul[data-type="taskList"] {
                    list-style: none;
                    padding: 0;
                }
                ul[data-type="taskList"] li {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                    margin-bottom: 0.25rem;
                }
                ul[data-type="taskList"] label {
                    user-select: none;
                    margin-top: 0.2rem;
                }
                ul[data-type="taskList"] input[type="checkbox"] {
                    cursor: pointer;
                    width: 1.1rem;
                    height: 1.1rem;
                    accent-color: hsl(var(--primary));
                }
                ul[data-type="taskList"] div {
                    flex: 1;
                }
                .prose a.location-link {
                    text-decoration: none;
                    color: inherit;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                }
                .prose a:hover {
                    color: hsl(var(--primary));
                }
                .mod-key-pressed .prose a {
                    cursor: pointer !important;
                }
            ` }} />
        </div>
    )
}
