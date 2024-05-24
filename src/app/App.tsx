import { useMutation } from '@apollo/client'
import { AppBar, Box, Stack, Toolbar } from '@mui/material'
import { memo, useEffect, useState } from 'react'

import { GameDialogSuspense } from '#src/games/GameDialog'
import GameList from '#src/games/GameList'
import ImportDropZone from '#src/games/ImportDropZone'
import type { SuspenseWrappedPromise } from '#src/lib/wrapPromiseForSuspense'
import { wrapPromiseForSuspense } from '#src/lib/wrapPromiseForSuspense'
import KnownSourcePortsDialog from '#src/sourcePorts/KnownSourcePortsDialog'
import { SourcePortsProvider } from '#src/sourcePorts/sourcePortsContext'
import SourcePortsDialog from '#src/sourcePorts/SourcePortsDialog'

import AppCogMenu from './AppCogMenu'
import { AppToolbarProvider, AppToolbarSlot } from './AppToolbarArea'
import OnboardingAlerts from './OnboardingAlerts'
import { InitializeAppDocument } from './operations.generated'

function App() {
  return (
    <Initializer>
      <SourcePortsProvider>
        <ImportDropZone>
          <AppToolbarProvider>
            <AppBar position="sticky">
              <Toolbar sx={{ gap: 2 }}>
                <AppToolbarSlot
                  renderSlot={(props) => {
                    return (
                      <Stack
                        alignItems="center"
                        spacing={2}
                        direction="row"
                        ref={props.ref}
                      />
                    )
                  }}
                />

                <Box flexGrow="1" />

                <AppCogMenu />
              </Toolbar>
            </AppBar>

            <OnboardingAlerts />

            <GameList />
          </AppToolbarProvider>
        </ImportDropZone>

        <GameDialogSuspense />

        <SourcePortsDialog />
        <KnownSourcePortsDialog />
      </SourcePortsProvider>
    </Initializer>
  )
}

function Initializer(props: React.PropsWithChildren) {
  const [initializeApp] = useMutation(InitializeAppDocument)
  const [wrappedPromise, setWrappedPromise] =
    useState<SuspenseWrappedPromise<unknown>>()

  useEffect(() => {
    setWrappedPromise(wrapPromiseForSuspense(initializeApp()))
  }, [initializeApp])

  return (
    <>{wrappedPromise?.read().status === 'success' ? props.children : null}</>
  )
}

export default memo(App)
