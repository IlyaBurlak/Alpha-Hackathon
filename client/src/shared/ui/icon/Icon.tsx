import type { ReactNode } from 'react'

import styles from './Icon.module.css'

const ICONS = {
  home: <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />,
  applications: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.7 9.6a2.4 2.4 0 1 1 3.3 2.2c-.6.3-1 .8-1 1.5v.3M12 16.6v.1" />
    </>
  ),
  down: <path d="m7 10 5 5 5-5" />,
  updown: <path d="m8 9.5 4-4 4 4M8 14.5l4 4 4-4" />,
  right: <path d="m10 7 5 5-5 5" />,
  left: <path d="m14 7-5 5 5 5" />,
  check: <path d="m6 12.5 4 4 8-8.5" />,
  close: <path d="M7 7l10 10M17 7 7 17" />,
  lock: (
    <>
      <rect x="5.5" y="10.5" width="13" height="9" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  pen: <path d="M5 19h3.5L18.5 9 15 5.5 5 15.5z" />,
  document: (
    <>
      <path d="M13.5 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5z" />
      <path d="M13.5 3.5v5h5" />
    </>
  ),
  dots: <path d="M6 12h.01M12 12h.01M18 12h.01" strokeWidth="2.6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8v.1" />
    </>
  ),
} as const satisfies Record<string, ReactNode>

export type IconName = keyof typeof ICONS

const DEFAULT_SIZE = 24

interface IconProps {
  name: IconName
  size?: number
}

export function Icon({ name, size = DEFAULT_SIZE }: IconProps) {
  return (
    <svg
      className={styles.icon}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}
