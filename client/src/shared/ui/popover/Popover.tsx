import { useEffect, useState } from 'react'
import type { CSSProperties, MouseEvent, ReactNode } from 'react'

import { clamp } from '@/shared/lib'

import styles from './Popover.module.css'

const PANEL_WIDTH = 300
const VIEWPORT_MARGIN = 12
const PANEL_OFFSET = 8

export interface PopoverTriggerProps {
  onClick: (event: MouseEvent<HTMLElement>) => void
  'aria-haspopup': 'menu'
  'aria-expanded': boolean
}

interface PopoverProps {
  /** Accessible name of the opened menu. */
  label: string
  /** Class of the element that wraps the trigger; use it to size the trigger. */
  className?: string
  renderTrigger: (triggerProps: PopoverTriggerProps) => ReactNode
  children: (close: () => void) => ReactNode
}

/** Opens next to the trigger: below it, or above when the trigger sits in the lower half of the screen. */
function getPanelPosition(anchor: DOMRect): CSSProperties {
  const left = clamp(anchor.left, VIEWPORT_MARGIN, window.innerWidth - PANEL_WIDTH - VIEWPORT_MARGIN)
  return anchor.top > window.innerHeight / 2
    ? { left, bottom: window.innerHeight - anchor.top + PANEL_OFFSET }
    : { left, top: anchor.bottom + PANEL_OFFSET }
}

export function Popover({ label, className, renderTrigger, children }: PopoverProps) {
  const [position, setPosition] = useState<CSSProperties | null>(null)

  const close = () => setPosition(null)

  const open = (event: MouseEvent<HTMLElement>) => {
    setPosition(getPanelPosition(event.currentTarget.getBoundingClientRect()))
  }

  const isOpen = position !== null

  useEffect(() => {
    if (!isOpen) return undefined
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPosition(null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <div className={className ?? styles.anchor}>
      {renderTrigger({ onClick: open, 'aria-haspopup': 'menu', 'aria-expanded': isOpen })}
      {isOpen && (
        <>
          <button type="button" className={styles.backdrop} aria-label="Закрыть меню" tabIndex={-1} onClick={close} />
          <div className={styles.panel} role="menu" aria-label={label} style={position}>
            {children(close)}
          </div>
        </>
      )}
    </div>
  )
}
