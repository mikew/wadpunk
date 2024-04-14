import i18nConfig from '../config'

async function prepareSupportedLocales() {
  i18nConfig.supportedLocales = await i18nConfig.getSupportedLocales()
}

export default prepareSupportedLocales
