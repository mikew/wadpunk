import type { Dict } from 'i18n-js'

import type { I18nConfig } from './lib/types'

const localeMap: Record<string, () => Promise<Dict>> = {
  en: () => import('./translations/en.json').then((m) => m.default),
  fr: () => import('#src/i18n/translations/fr.json').then((m) => m.default),
}

const i18nConfig: I18nConfig = {
  defaultLocale: 'en',
  getSupportedLocales: async () => {
    return ['en', 'fr']
  },
  cookieName: 'NEXT_LOCALE',
  cookieLifetime: 86_400_000 * 365,
  loadTranslations: async (locale) => {
    return localeMap[locale]?.() || {}
  },
}

export default i18nConfig
