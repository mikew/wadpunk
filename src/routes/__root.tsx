import { ApolloProvider } from '@apollo/client/react'
import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { CssBaseline, Slide, ThemeProvider } from '@mui/material'
import localStorageStore from '@promoboxx/use-filter/store/localStorageStore'
import { UseFilterProvider } from '@promoboxx/use-filter/UseFilterProvider'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { SnackbarProvider } from 'notistack'
import { StrictMode, useState } from 'react'
import { Provider } from 'react-redux'

import theme from '#src/app/theme'
import ClientLocaleEffect from '#src/i18n/ClientLocaleEffect'
import bootstrapI18n from '#src/i18n/lib/bootstrapI18n'
import htmlDirAttribute from '#src/i18n/lib/htmlDirAttribute'
import I18nProvider from '#src/i18n/lib/I18nProvider'
import { ConfirmDialog, ConfirmDialogProvider } from '#src/lib/ConfirmDialog'
import NotistackMuiAlert from '#src/mui/NotistackMuiAlert'
import type { RouterContext } from '#src/router'
import TauriExternalLinkHandler from '#src/tauri/TauriExternalLinkHandler'
import TauriUpdateNotifier from '#src/tauri/TauriUpdateNotifier'

export const Route = createRootRouteWithContext<RouterContext>()({
  loader: () => {
    return bootstrapI18n()
  },
  // The I18nProvider manages the locale after the initial load.
  staleTime: Infinity,
  head: () => ({
    meta: [{ title: 'WADPunk' }],
  }),
  component: RootComponent,
})

function RootComponent() {
  const { store, apolloClient } = Route.useRouteContext()
  const i18n = Route.useLoaderData()
  const [emotionCache] = useState(() => createCache({ key: 'css' }))

  return (
    <RootDocument locale={i18n.currentLocale}>
      <StrictMode>
        <Provider store={store}>
          <ApolloProvider client={apolloClient}>
            <UseFilterProvider store={localStorageStore}>
              <CacheProvider value={emotionCache}>
                <ThemeProvider theme={theme}>
                  <SnackbarProvider
                    Components={{
                      default: NotistackMuiAlert,
                      info: NotistackMuiAlert,
                      warning: NotistackMuiAlert,
                      success: NotistackMuiAlert,
                      error: NotistackMuiAlert,
                    }}
                    TransitionComponent={Slide}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    maxSnack={3}
                  >
                    <CssBaseline>
                      <I18nProvider
                        locale={i18n.currentLocale}
                        translations={i18n.translations}
                        supportedLocales={i18n.supportedLocales}
                      >
                        <ClientLocaleEffect />

                        <ConfirmDialogProvider>
                          <Outlet />

                          <ConfirmDialog />

                          <TauriUpdateNotifier />

                          <TauriExternalLinkHandler />
                        </ConfirmDialogProvider>
                      </I18nProvider>
                    </CssBaseline>
                  </SnackbarProvider>
                </ThemeProvider>
              </CacheProvider>
            </UseFilterProvider>
          </ApolloProvider>
        </Provider>
      </StrictMode>
    </RootDocument>
  )
}

function RootDocument(
  props: React.PropsWithChildren<{ locale: string }>,
) {
  return (
    <html
      lang={props.locale}
      dir={htmlDirAttribute(props.locale)}
    >
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <meta name="emotion-insertion-point" content="" />
        {/* Avoids a white flash before the theme loads. */}
        <style>{'body { background: rgb(14, 14, 16); }'}</style>
        {
          // HACK Fix vite-plugin-checker https://github.com/fi3ework/vite-plugin-checker/issues/733#issuecomment-4632308970
          import.meta.env.DEV && !import.meta.env.VITEST ? (
            <script
              type="module"
              src="/@id/virtual:@vite-plugin-checker-runtime-entry"
            />
          ) : null
        }
        <HeadContent />
      </head>
      <body>
        {props.children}
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}
