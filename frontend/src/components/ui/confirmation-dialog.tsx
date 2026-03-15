import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  isLoading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
}: ConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">{title}</DialogTitle>
          <DialogDescription className="font-mono text-[0.72rem] text-ink-muted/70 leading-relaxed pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="font-mono text-[0.7rem] uppercase tracking-widest"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={isDestructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
            className={isDestructive ? 'bg-red-500 hover:bg-red-600 text-white font-mono text-[0.7rem] uppercase tracking-widest' : 'btn-primary font-mono text-[0.7rem] uppercase tracking-widest'}
          >
            {isLoading ? <LoadingSpinner className="mr-2 h-3 w-3" /> : null}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
