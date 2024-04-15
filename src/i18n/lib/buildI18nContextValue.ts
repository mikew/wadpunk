import { I18n } from 'i18n-js'

import i18nConfig from '../config'

import type { I18nContextValue, I18nTranslations } from './types'

function buildI18nContextValue(
  locale: string,
  translations: I18nTranslations,
  setLocale: I18nContextValue['setLocale'],
) {
  const i18n = new I18n()
  i18n.locale = locale
  i18n.defaultLocale = i18nConfig.defaultLocale
  i18n.store({ [locale]: translations })

  const contextValue: I18nContextValue = {
    setLocale,
    t: i18n.t.bind(i18n),
    l: i18n.l.bind(i18n),
    p: i18n.p.bind(i18n),

    locale,

    numberToCurrency: i18n.numberToCurrency.bind(i18n),
    numberToPercentage: i18n.numberToPercentage.bind(i18n),
    numberToHumanSize: i18n.numberToHumanSize.bind(i18n),
    numberToHuman: i18n.numberToHuman.bind(i18n),
    numberToRounded: i18n.numberToRounded.bind(i18n),
    numberToDelimited: i18n.numberToDelimited.bind(i18n),
    timeAgoInWords: i18n.timeAgoInWords.bind(i18n),
    formatNumber: i18n.formatNumber.bind(i18n),
  }

  return contextValue
}

export default buildI18nContextValue
