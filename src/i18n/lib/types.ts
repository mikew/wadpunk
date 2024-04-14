import type { Dict, I18n } from 'i18n-js'

export interface I18nContextValue
  extends Pick<
    I18n,
    // Intentionally not grabbing `locale`, as it's a getter/setter and we need
    // our own setter for that.
    | 't'
    | 'l'
    | 'p'
    | 'numberToCurrency'
    | 'numberToPercentage'
    | 'numberToHumanSize'
    | 'numberToHuman'
    | 'numberToRounded'
    | 'numberToDelimited'
    | 'timeAgoInWords'
    | 'formatNumber'
  > {
  locale: string
  setLocale: (locale: string) => Promise<void>
}

export type I18nTranslations = Dict

export interface I18nConfig {
  defaultLocale: string
  /**
   * This is set by the system, you shouldn't be setting it yourself. Use
   * `getSupportedLocales`
   */
  supportedLocales?: string[]
  getSupportedLocales: () => Promise<string[]>
  cookieName: string
  cookieLifetime: number
  loadTranslations: (locale: string) => Promise<I18nTranslations>
}
