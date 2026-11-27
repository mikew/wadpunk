import {
  getLocaleFromLocalStorage,
  saveLocaleToLocalStorage,
  setHtmlLocaleAttributes,
} from './lib/localePersistence'
import type { I18nConfig, I18nTranslations } from './lib/types'

const localeMap: Record<string, () => Promise<I18nTranslations>> = {
  'en-ca': () => import('./translations/en.json').then((m) => m.default),
  'fr-ca': () =>
    import('#src/i18n/translations/fr.json').then((m) => m.default),
  'de': () => import('#src/i18n/translations/de.json').then((m) => m.default),

  'fallback-en': () => import('./translations/en.json').then((m) => m.default),
  'fallback-fr': () =>
    import('#src/i18n/translations/fr.json').then((m) => m.default),
  'fallback-de': () =>
    import('#src/i18n/translations/de.json').then((m) => m.default),
}

const i18nConfig: I18nConfig = {
  defaultLocale: 'en-CA',
  getSupportedLocales: async () => {
    return Object.keys(localeMap).filter((x) => !x.startsWith('fallback-'))
  },
  cookieName: 'NEXT_LOCALE',
  cookieLifetime: 86_400_000 * 365,
  loadTranslations: async (locale) => {
    const normalized = locale.toLowerCase().replace('_', '-')
    const firstPart = normalized.split('-')[0] || ''

    const found = localeMap[normalized] || localeMap[`fallback-${firstPart}`]

    if (!found) {
      throw new Error(`Unsupported locale: ${locale}`)
    }

    return found()
  },

  getPreferredLocale: () => {
    // The SPA shell is rendered in Node, where there is no user to ask.
    // `ClientLocaleEffect` switches to the right locale once loaded.
    if (typeof window === 'undefined') {
      return null
    }

    return getLocaleFromLocalStorage(i18nConfig.cookieName)
  },
  saveLocale: (locale) => {
    saveLocaleToLocalStorage(i18nConfig.cookieName, locale)
    setHtmlLocaleAttributes(locale)
  },
}

export default i18nConfig
