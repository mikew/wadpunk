import i18nConfig from '../config'

import normalizeLocale from './normalizeLocale'
import prepareSupportedLocales from './prepareSupportedLocales'
import type { I18nInstance } from './types'

async function bootstrapI18n(locale?: string | null) {
  await prepareSupportedLocales()

  const currentLocale = normalizeLocale(
    locale || (await i18nConfig.getPreferredLocale()),
  )

  const translations = await i18nConfig.loadTranslations(currentLocale)

  const instance: I18nInstance = {
    currentLocale,
    translations,
    supportedLocales: i18nConfig.supportedLocales || [],
  }

  return instance
}

export default bootstrapI18n
