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
}

export default i18nConfig
