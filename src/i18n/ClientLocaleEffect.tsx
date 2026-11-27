import { useEffect } from 'react'

import i18nConfig from './config'
import { useI18nContext } from './lib/i18nContext'
import normalizeLocale, { normalizeForComparison } from './lib/normalizeLocale'

// The HTML shell is rendered without knowing the user's preferred locale
// (prerendered at build time, or by the dev server), since it's only known to
// the client. If the locale rendered isn't the user's preferred locale, switch
// to it. Otherwise this does nothing.
const ClientLocaleEffect = () => {
  const { setLocale, locale } = useI18nContext()

  useEffect(() => {
    async function run() {
      const preferredLocale = normalizeLocale(
        await i18nConfig.getPreferredLocale(),
      )

      if (
        normalizeForComparison(preferredLocale)
        !== normalizeForComparison(locale)
      ) {
        await setLocale(preferredLocale)
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only check the initial locale
  }, [])

  return null
}

export default ClientLocaleEffect
