import { useState, useRef, useEffect } from 'react'
import { Folder, FolderOpen, FileText, ChevronRight, Edit2, Trash2, FilePlus, FolderPlus } from 'lucide-react'
import type { JournalItem } from '@/types/journal'
import { cn } from '@/lib/utils'
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { Input } from "@/components/ui/input"

interface FileTreeProps {
    items: JournalItem[]
    selectedId?: string
    onSelectFile: (item: JournalItem) => void
    onRename?: (id: string, newName: string) => void
    onDelete?: (id: string) => void
    onAdd?: (parentId: string | null, type: 'file' | 'folder') => void
    openFolders: Set<string>
    onToggleFolder: (id: string) => void
    newlyCreatedId?: string | null
    onClearNewlyCreated?: () => void
}

interface FileTreeItemProps {
    item: JournalItem
    depth: number
    selectedId?: string
    onSelectFile: (item: JournalItem) => void
    onRename?: (id: string, newName: string) => void
    onDelete?: (id: string) => void
    onAdd?: (parentId: string | null, type: 'file' | 'folder') => void
    openFolders: Set<string>
    toggleFolder: (id: string) => void
    newlyCreatedId?: string | null
    onClearNewlyCreated?: () => void
}

function FileTreeItem({
    item,
    depth,
    selectedId,
    onSelectFile,
    onRename,
    onDelete,
    onAdd,
    openFolders,
    toggleFolder,
    newlyCreatedId,
    onClearNewlyCreated,
}: FileTreeItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(item.name)
    const inputRef = useRef<HTMLInputElement>(null)

    const isOpen = openFolders.has(item.id)
    const isSelected = selectedId === item.id
    const isFolder = item.type === 'folder'
    const hasChildren = isFolder && item.items && item.items.length > 0

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus()
            inputRef.current?.select()
        }
    }, [isEditing])

    // Auto-trigger rename for newly created items
    useEffect(() => {
        if (newlyCreatedId === item.id) {
            setIsEditing(true)
            onClearNewlyCreated?.()
        }
    }, [newlyCreatedId, item.id, onClearNewlyCreated])

    const handleClick = () => {
        if (isFolder) {
            toggleFolder(item.id)
        } else {
            onSelectFile(item)
        }
    }

    const handleRename = () => {
        if (editName.trim() && editName !== item.name) {
            onRename?.(item.id, editName.trim())
        } else {
            setEditName(item.name)
        }
        setIsEditing(false)
    }

    const itemContent = (
        <button
            onClick={handleClick}
            className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors text-left group/item',
                'hover:bg-gray-100',
                isSelected && 'bg-gray-100 font-medium'
            )}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
            {isFolder && (
                <ChevronRight
                    className={cn(
                        'h-4 w-4 text-gray-400 transition-transform shrink-0',
                        isOpen && 'rotate-90'
                    )}
                />
            )}
            {!isFolder && <span className="w-4" />}

            {isFolder ? (
                isOpen ? (
                    <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
                ) : (
                    <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                )
            ) : (
                <FileText className="h-4 w-4 text-sky-500 shrink-0" />
            )}

            {isEditing ? (
                <Input
                    ref={inputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename()
                        if (e.key === 'Escape') {
                            setEditName(item.name)
                            setIsEditing(false)
                        }
                    }}
                    className="h-6 py-0 px-1 text-sm focus-visible:ring-1"
                />
            ) : (
                <span className="truncate flex-1">{item.name}</span>
            )}
        </button>
    )

    return (
        <div>
            <ContextMenu>
                <ContextMenuTrigger>
                    {itemContent}
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                    <ContextMenuItem onClick={() => setIsEditing(true)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        <span>Rename</span>
                    </ContextMenuItem>
                    {isFolder && (
                        <>
                            <ContextMenuSeparator />
                            <ContextMenuItem onClick={() => onAdd?.(item.id, 'file')}>
                                <FilePlus className="mr-2 h-4 w-4" />
                                <span>New File</span>
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => onAdd?.(item.id, 'folder')}>
                                <FolderPlus className="mr-2 h-4 w-4" />
                                <span>New Folder</span>
                            </ContextMenuItem>
                        </>
                    )}
                    <ContextMenuSeparator />
                    <ContextMenuItem
                        onClick={() => onDelete?.(item.id)}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>

            {isFolder && isOpen && hasChildren && (
                <div>
                    {item.items!.map((child) => (
                        <FileTreeItem
                            key={child.id}
                            item={child}
                            depth={depth + 1}
                            selectedId={selectedId}
                            onSelectFile={onSelectFile}
                            onRename={onRename}
                            onDelete={onDelete}
                            onAdd={onAdd}
                            openFolders={openFolders}
                            toggleFolder={toggleFolder}
                            newlyCreatedId={newlyCreatedId}
                            onClearNewlyCreated={onClearNewlyCreated}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export function FileTree({
    items,
    selectedId,
    onSelectFile,
    onRename,
    onDelete,
    onAdd,
    openFolders,
    onToggleFolder,
    newlyCreatedId,
    onClearNewlyCreated,
}: FileTreeProps) {
    if (!items || items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/20 mb-2" />
                <p className="text-xs text-muted-foreground">No files yet</p>
                <button
                    className="text-xs text-primary hover:underline mt-2"
                    onClick={() => onAdd?.(null, 'file')}
                >
                    Create one
                </button>
            </div>
        )
    }

    return (
        <div className="py-2">
            {items.map((item) => (
                <FileTreeItem
                    key={item.id}
                    item={item}
                    depth={0}
                    selectedId={selectedId}
                    onSelectFile={onSelectFile}
                    onRename={onRename}
                    onDelete={onDelete}
                    onAdd={onAdd}
                    openFolders={openFolders}
                    toggleFolder={onToggleFolder}
                    newlyCreatedId={newlyCreatedId}
                    onClearNewlyCreated={onClearNewlyCreated}
                />
            ))}
        </div>
    )
}
