import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import JobUrlAutoFill from './JobUrlAutoFill'

export default function ImportJobLinkModal({ open, onOpenChange, onParsed }) {
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    if (open) setFormKey(k => k + 1)
  }, [open])

  const handleParsed = (data) => {
    onOpenChange(false)
    onParsed(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100%-2rem)] p-0 gap-0 overflow-hidden sm:max-w-2xl">
        <DialogHeader className="px-8 pt-8 pb-6 border-b border-border bg-muted/20 text-left space-y-4">
          <div className="flex items-start gap-4 pr-8">
            <div className="h-11 w-11 rounded-lg border border-primary/20 bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <DialogTitle className="text-xl">Import from link</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                Paste a job posting URL and we&apos;ll extract the company, role, and details to pre-fill your application.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="px-8 py-8">
          <JobUrlAutoFill key={formKey} embedded layout="stacked" onParsed={handleParsed} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
