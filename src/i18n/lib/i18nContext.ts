import { createContext, useContext } from 'react'

import type { I18nContextValue } from './types'

export const i18nContext = createContext<I18nContextValue | undefined>(
  undefined,
)

export function useI18nContext() {
  const value = useContext(i18nContext)

  if (!value) {
    throw new Error()
  }

  return value
}
