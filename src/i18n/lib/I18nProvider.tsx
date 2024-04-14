import { useCallback, useState } from 'react'

import i18nConfig from '../config'

import buildI18nContextValue from './buildI18nContextValue'
import htmlDirAttribute from './htmlDirAttribute'
import { i18nContext } from './i18nContext'
import normalizeLocale from './normalizeLocale'
import type { I18nTranslations } from './types'

const I18nProvider: React.FC<
  React.PropsWithChildren<{
    locale: string
    translations: I18nTranslations
    supportedLocales: string[]
  }>
> = (props) => {
  i18nConfig.supportedLocales = props.supportedLocales

  const setLocale = useCallback(async (locale: string) => {
    const normalizedLocale = normalizeLocale(locale)
    const translations = await i18nConfig.loadTranslations(normalizedLocale)

    setContextValue(
      buildI18nContextValue(normalizedLocale, translations, setLocale),
    )

    localStorage.setItem(i18nConfig.cookieName, normalizedLocale)

    const html = document.querySelector('html')

    if (html) {
      html.setAttribute('lang', normalizedLocale)
      html.setAttribute('dir', htmlDirAttribute(normalizedLocale))
    }
  }, [])

  const [contextValue, setContextValue] = useState(() => {
    return buildI18nContextValue(props.locale, props.translations, setLocale)
  })

  return (
    <i18nContext.Provider value={contextValue}>
      {props.children}
    </i18nContext.Provider>
  )
}

export default I18nProvider
