import { createPortal } from 'react-dom'
import { useEffect, useState, type RefObject, type ReactNode } from 'react'

interface PopoverPortalProps {
  triggerRef: RefObject<HTMLElement | null>
  open: boolean
  onClose: () => void
  align?: 'left' | 'right'
  width?: number
  children: ReactNode
}

// Approximate rendered height of a calendar popover (header + weekday row +
// up to 6 day rows + padding). Used only to decide whether to flip the
// popover above the trigger when there isn't room below - an estimate is
// fine here since a wrong guess costs a few px of gap/overlap, not breakage.
const ESTIMATED_HEIGHT = 380

// Renders into document.body via a portal so the popover is never clipped by
// an ancestor's `overflow-hidden` (very common on this app's rounded cards)
// and always sits above any local stacking context. Position is recomputed
// from the trigger's bounding rect on open, and kept in sync on scroll/resize
// rather than closing on scroll - closing was tried first, but the browser's
// own "scroll into view" behavior on the click that opens the popover fires
// a scroll event immediately, which closed it the instant it opened.
export default function PopoverPortal({ triggerRef, open, onClose, align = 'left', width = 288, children }: PopoverPortalProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!open) { setPosition(null); return }

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const spaceBelow = window.innerHeight - rect.bottom
      const openAbove = spaceBelow < ESTIMATED_HEIGHT && rect.top > spaceBelow
      setPosition({
        top: openAbove ? Math.max(8, rect.top - ESTIMATED_HEIGHT - 8) : rect.bottom + 8,
        left: align === 'right' ? Math.max(8, rect.right - width) : rect.left,
      })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, align, width, triggerRef])

  if (!open || !position) return null

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        style={{ position: 'fixed', top: position.top, left: position.left, maxHeight: 'calc(100vh - 16px)' }}
        className="z-50 bg-white rounded-xl border border-line shadow-lg p-4 overflow-y-auto"
      >
        {children}
      </div>
    </>,
    document.body
  )
}
