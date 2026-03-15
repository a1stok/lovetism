import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, Home, ChevronRight as ChevronRightIcon, Folder, FileText, Maximize2, Minimize2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileTree } from '@/components/journal/file-tree'
import { InlineEditor } from '@/components/ui/inline-editor'
import { RichTextEditor } from '@/components/journal/rich-text-editor'
import { JournalService } from './api/journal-service'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { JournalItem, JournalRow, TiptapJson } from '@/types/journal'
import { cn } from '@/lib/utils'

export function JournalDetailPage() {
    const { journalId } = useParams({ strict: false }) as Record<string, string>

    const [journal, setJournal] = useState<JournalRow | null>(null)
    const [items, setItems] = useState<JournalItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedFile, setSelectedFile] = useState<JournalItem | null>(null)
    const [fileContent, setFileContent] = useState<Record<string, any> | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [openFolders, setOpenFolders] = useState<Set<string>>(new Set())
    const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null)
    const [editingJournalName, setEditingJournalName] = useState(false)

    // Fetch journal + nodes from Supabase
    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true)
                const { journal: j, items: nodeTree } = await JournalService.fetchJournalWithNodes(journalId)
                setJournal(j)
                setItems(nodeTree)
            } catch (err: unknown) {
                console.error('Failed to load journal:', err)
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [journalId])

    const handleSelectFile = (item: JournalItem) => {
        setSelectedFile(item)
        setFileContent(item.content || null)
    }

    // Debounce timer ref for auto-saving content
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const debouncedSave = useCallback((nodeId: string, content: TiptapJson) => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => {
            JournalService.updateNode(nodeId, { content }).catch(console.error)
        }, 500)
    }, [])

    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        }
    }, [])

    const handleContentChange = (content: TiptapJson) => {
        setFileContent(content)
        if (selectedFile) {
            debouncedSave(selectedFile.id, content)
        }
    }

    const updateItems = (items: JournalItem[], id: string, updater: (item: JournalItem) => JournalItem | null): JournalItem[] => {
        return items.reduce((acc: JournalItem[], item) => {
            if (item.id === id) {
                const updated = updater(item)
                if (updated) acc.push(updated)
                return acc
            }
            if (item.items) {
                acc.push({ ...item, items: updateItems(item.items, id, updater) })
                return acc
            }
            acc.push(item)
            return acc
        }, [])
    }

    const addItemToItems = (items: JournalItem[], parentId: string | null, newItem: JournalItem): JournalItem[] => {
        if (parentId === null) return [...items, newItem]
        return items.map(item => {
            if (item.id === parentId) {
                return { ...item, items: [...(item.items || []), newItem] }
            }
            if (item.items) {
                return { ...item, items: addItemToItems(item.items, parentId, newItem) }
            }
            return item
        })
    }

    const handleRenameJournal = async (newName: string) => {
        const trimmed = newName.trim()
        if (!trimmed || !journal) return
        setJournal(prev => prev ? { ...prev, name: trimmed } : null)
        setEditingJournalName(false)
        try {
            await JournalService.updateJournal(journal.id, { name: trimmed })
        } catch (err: unknown) {
            console.error('Failed to rename journal:', err)
            setJournal(prev => prev ? { ...prev, name: journal.name } : null)
        }
    }

    const handleRename = async (id: string, newName: string) => {
        setItems(prev => updateItems(prev, id, (item) => ({ ...item, name: newName })))
        if (selectedFile?.id === id) {
            setSelectedFile(prev => prev ? { ...prev, name: newName } : null)
        }
        try {
            await JournalService.updateNode(id, { name: newName })
        } catch (err: unknown) {
            console.error('Failed to rename node:', err)
        }
    }

    const handleDelete = async (id: string) => {
        setItems(prev => updateItems(prev, id, () => null))
        if (selectedFile?.id === id) setSelectedFile(null)
        try {
            await JournalService.deleteNode(id)
        } catch (err: unknown) {
            console.error('Failed to delete node:', err)
        }
    }

    const handleAdd = async (parentId: string | null, type: 'file' | 'folder') => {
        if (!journal) return
        try {
            const data = await JournalService.createNode(journal.id, {
                parent_id: parentId,
                type,
                name: `New ${type}`,
                content: type === 'file' ? {} : null,
            })

            const newItem: JournalItem = {
                id: data.id,
                type,
                name: data.name,
                content: type === 'file' ? null : undefined,
                items: type === 'folder' ? [] : undefined,
            }

            setItems(prev => addItemToItems(prev, parentId, newItem))

            // Auto-expand parent and trigger rename
            if (parentId) {
                setOpenFolders(prev => new Set(prev).add(parentId))
            }
            setNewlyCreatedId(data.id)
        } catch (err: unknown) {
            console.error('Failed to create node:', err)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner className="h-6 w-6 text-mauve" />
            </div>
        )
    }

    if (!journal) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="font-mono text-[0.72rem] uppercase tracking-editorial text-ink-muted">Journal not found</p>
                <Link to="/journal">
                    <button className="btn-outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Journals
                    </button>
                </Link>
            </div>
        )
    }

    // Breadcrumbs
    const breadcrumbs = [
        { name: 'Journals', href: '/journal' },
        { name: journal.name, href: `/journal/${journal.id}` }
    ]
    if (selectedFile) {
        breadcrumbs.push({ name: selectedFile.name, href: '#' })
    }

    const sidebarContent = (
        <>
            <div className="p-4 border-b border-ink/5 flex items-center justify-between shrink-0">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted/50">Journal Archive</span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-surface">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleAdd(null, 'file')}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>New File</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAdd(null, 'folder')}>
                            <Folder className="mr-2 h-4 w-4" />
                            <span>New Folder</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <FileTree
                    items={items}
                    selectedId={selectedFile?.id}
                    onSelectFile={handleSelectFile}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onAdd={handleAdd}
                    openFolders={openFolders}
                    onToggleFolder={(id) => {
                        setOpenFolders(prev => {
                            const next = new Set(prev)
                            if (next.has(id)) next.delete(id)
                            else next.add(id)
                            return next
                        })
                    }}
                    newlyCreatedId={newlyCreatedId}
                    onClearNewlyCreated={() => setNewlyCreatedId(null)}
                />
            </div>
        </>
    )

    if (isFullScreen && selectedFile) {
        return (
            <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <header className="flex items-center justify-between px-6 py-3 border-b border-ink/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsFullScreen(false)}
                            className="text-ink-muted hover:text-ink hover:bg-surface"
                        >
                            <Minimize2 className="h-4 w-4 mr-2" />
                            Exit Focus
                        </Button>
                        <div className="h-4 w-px bg-divider" />
                        <nav className="flex items-center gap-1.5 text-[13px] text-ink-muted font-mono">
                            {breadcrumbs.map((crumb, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    {i > 0 && <ChevronRightIcon className="h-3 w-3 opacity-50" />}
                                    {i === 1 && editingJournalName ? (
                                        <InlineEditor
                                            value={journal.name}
                                            onSave={handleRenameJournal}
                                            onCancel={() => setEditingJournalName(false)}
                                            className="text-ink font-medium min-w-[100px]"
                                        />
                                    ) : i === 1 ? (
                                        <div className="flex items-center gap-0.5 group">
                                            <span className="text-ink font-medium">{crumb.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => setEditingJournalName(true)}
                                                className="p-0.5 text-ink-muted/40 hover:text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity rounded"
                                                title="Rename journal"
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className={cn(i === breadcrumbs.length - 1 && "text-ink font-medium")}>
                                            {crumb.name}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden relative">
                    <aside
                        className={cn(
                            "bg-cream border-r border-ink/5 transition-all duration-300 ease-in-out flex flex-col overflow-hidden",
                            isSidebarOpen ? "w-64" : "w-0 border-r-0"
                        )}
                    >
                        {sidebarContent}
                    </aside>

                    <main className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                        <div className="max-w-4xl mx-auto py-12 px-12">
                            <div className="space-y-6">
                                <h1 className="font-serif text-4xl font-light tracking-tight text-ink border-none focus:outline-none">
                                    {selectedFile.name}
                                </h1>
                                <div className="bg-white min-h-[600px] -mx-4">
                                    <RichTextEditor
                                        key={selectedFile.id}
                                        content={fileContent}
                                        onChange={handleContentChange}
                                        className="tiptap-editor-container"
                                    />
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* Floating Toggle for Sidebar in focus mode */}
                    <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                            "absolute left-4 bottom-4 h-8 w-8 rounded-full shadow-md bg-white z-[60] transition-all border-ink/10",
                            !isSidebarOpen && "left-4"
                        )}
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-white">
            <header className="flex items-center justify-between px-4 py-2 border-b border-ink/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10 transition-all duration-300">
                <div className="flex items-center gap-2 text-sm text-ink-muted overflow-hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>

                    <nav className="flex items-center gap-1.5 truncate text-[13px] font-mono">
                        {breadcrumbs.map((crumb, i) => (
                            <div key={i} className="flex items-center gap-1.5 shrink-0">
                                {i > 0 && <ChevronRightIcon className="h-3.5 w-3.5 opacity-50" />}
                                {i === 1 && editingJournalName ? (
                                    <div className="flex items-center gap-1 min-w-[120px]">
                                        <InlineEditor
                                            value={journal.name}
                                            onSave={handleRenameJournal}
                                            onCancel={() => setEditingJournalName(false)}
                                            className="text-ink font-medium px-2 py-1 min-w-[100px]"
                                        />
                                    </div>
                                ) : crumb.href !== '#' ? (
                                    <div className="flex items-center gap-0.5 group">
                                        <Link
                                            to={crumb.href}
                                            className="hover:text-ink hover:bg-surface/50 px-2 py-1 rounded transition-colors"
                                        >
                                            {crumb.name}
                                        </Link>
                                        {i === 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setEditingJournalName(true)}
                                                className="p-0.5 text-ink-muted/40 hover:text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity rounded"
                                                title="Rename journal"
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-ink font-medium px-2 py-1">{crumb.name}</span>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                <aside
                    className={cn(
                        "bg-cream border-r border-ink/5 transition-all duration-300 ease-in-out flex flex-col overflow-hidden",
                        isSidebarOpen ? "w-64" : "w-0 border-r-0"
                    )}
                >
                    {sidebarContent}
                </aside>

                <main className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                    <div className={cn(
                        "max-w-4xl mx-auto transition-all duration-500",
                        selectedFile ? "py-12" : "py-24"
                    )}>
                        {selectedFile ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="px-12">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="font-serif text-4xl font-light tracking-tight text-ink border-none focus:outline-none">
                                            {selectedFile.name}
                                        </h2>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsFullScreen(true)}
                                            className="text-ink-muted hover:text-ink"
                                        >
                                            <Maximize2 className="h-4 w-4 mr-2" />
                                            Expand
                                        </Button>
                                    </div>
                                    <div className="bg-white min-h-[600px] -mx-4">
                                        <RichTextEditor
                                            key={selectedFile.id}
                                            content={fileContent}
                                            onChange={handleContentChange}
                                            className="tiptap-editor-container"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                                <div className="w-16 h-16 bg-surface/50 rounded-2xl flex items-center justify-center mb-4">
                                    <Home className="h-8 w-8 text-ink-muted/20" />
                                </div>
                                <h3 className="font-serif text-lg text-ink font-medium">Select a page</h3>
                                <p className="font-mono text-[0.66rem] text-ink-muted/60 max-w-[240px] mt-1">
                                    Choose a file from the sidebar to view or edit its content.
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
