import { createContext, useContext } from 'react'

export type ShowToast = (text: string) => void

export const ToastContext = createContext<ShowToast | null>(null)

/** Returns a function that shows a short message at the bottom of the screen. */
export function useToast(): ShowToast {
  const showToast = useContext(ToastContext)
  if (!showToast) throw new Error('useToast must be used inside ToastProvider')
  return showToast
}
