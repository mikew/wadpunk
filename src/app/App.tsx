import { useMutation } from '@apollo/client'
import { AppBar, Box, Toolbar } from '@mui/material'
import { useEffect, useState } from 'react'

import { GameDialogSuspense } from '#src/games/GameDialog'
import GameList from '#src/games/GameList'
import ImportDropZone from '#src/games/ImportDropZone'
import { InitializeAppDocument } from '#src/graphql/operations'
import type { SuspenseWrappedPromise } from '#src/lib/wrapPromiseForSuspense'
import { wrapPromiseForSuspense } from '#src/lib/wrapPromiseForSuspense'
import SourcePortsDialog from '#src/sourcePorts/SourcePortsDialog'

import AppCogMenu from './AppCogMenu'
import { AppToolbarProvider, AppToolbarSlot } from './AppToolbarArea'
import OnboardingAlerts from './OnboardingAlerts'
import UpdateNotifier from './UpdateNotifier'

function App() {
  return (
    <Initializer>
      <ImportDropZone>
        <AppToolbarProvider>
          <AppBar position="sticky">
            <Toolbar sx={{ gap: 2 }}>
              <AppToolbarSlot />

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
      <UpdateNotifier />
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

export default App
