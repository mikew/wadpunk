import i18nConfig from '../config'

function normalizeLocale(locale: string | null | undefined) {
  if (
    i18nConfig.supportedLocales == null ||
    i18nConfig.supportedLocales.length === 0
  ) {
    throw new Error('i18nConfig.supportedLocales is empty')
  }

  const foundLocale = i18nConfig.supportedLocales.find(
    (x) => x.toLowerCase() === (locale || '').toLowerCase(),
  )

  if (!foundLocale) {
    return i18nConfig.defaultLocale
  }

  return foundLocale
}

export default normalizeLocale
