// https://localizejs.com/articles/localizing-for-right-to-left-languages-the-issues-to-consider/
const RTL_LOCALES = [
  'ar',
  'arc',
  'ckb',
  'dv',
  'fa',
  'ha',
  'he',
  'khw',
  'ks',
  'ps',
  'sd',
  'ur',
  'uz_af',
  'uz-af',
  'yi',
]

function htmlDirAttribute(locale: string) {
  if (
    RTL_LOCALES.includes(locale.toLowerCase()) ||
    RTL_LOCALES.includes(locale.toLowerCase().split('-')[0])
  ) {
    return 'rtl'
  }

  return 'ltr'
}

export default htmlDirAttribute
