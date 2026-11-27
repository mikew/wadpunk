import htmlDirAttribute from './htmlDirAttribute'

// Helpers for `i18nConfig.getPreferredLocale` and `i18nConfig.saveLocale`.

export function getLocaleFromLocalStorage(key: string) {
  return localStorage.getItem(key) || navigator.languages[0] || null
}

export function saveLocaleToLocalStorage(key: string, locale: string) {
  localStorage.setItem(key, locale)
}

export function setHtmlLocaleAttributes(locale: string) {
  const html = document.querySelector('html')

  if (html) {
    html.setAttribute('lang', locale)
    html.setAttribute('dir', htmlDirAttribute(locale))
  }
}
