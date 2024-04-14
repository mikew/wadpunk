import { useEffect, useRef, useState } from 'react'

import {
  wrapPromiseForSuspense,
  type SuspenseWrappedPromise,
} from '#src/lib/wrapPromiseForSuspense'

import i18nConfig from './config'
import I18nProvider from './lib/I18nProvider'
import normalizeLocale from './lib/normalizeLocale'
import prepareSupportedLocales from './lib/prepareSupportedLocales'
import type { I18nTranslations } from './lib/types'

const I18nLoader: React.FC<React.PropsWithChildren> = (props) => {
  const i18nRef = useRef<{
    currentLocale: string
    translations: I18nTranslations
  }>()
  const [wrappedPromise, setWrappedPromise] =
    useState<SuspenseWrappedPromise<unknown>>()

  useEffect(() => {
    async function run() {
      await prepareSupportedLocales()
      const currentLocale = normalizeLocale(
        localStorage.getItem(i18nConfig.cookieName) || navigator.languages[0],
      )
      const translations = await i18nConfig.loadTranslations(currentLocale)

      i18nRef.current = {
        currentLocale,
        translations,
      }
    }

    setWrappedPromise(wrapPromiseForSuspense(run()))
  }, [])

  return (
    <>
      {wrappedPromise?.read().status === 'success' && i18nRef.current ? (
        <>
          <I18nProvider
            supportedLocales={i18nConfig.supportedLocales || []}
            locale={i18nRef.current.currentLocale}
            translations={i18nRef.current.translations}
          >
            {props.children}
          </I18nProvider>
        </>
      ) : null}
    </>
  )
}

export default I18nLoader
