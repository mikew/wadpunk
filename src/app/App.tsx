import { useMutation } from '@apollo/client'
import { Box, CircularProgress } from '@mui/material'
import type { PropsWithChildren } from 'react'
import { Suspense, useEffect, useState } from 'react'

import GameList from '#src/games/GameList'
import ImportDropZone from '#src/games/ImportDropZone'
import { InitializeAppDocument } from '#src/graphql/operations'
import type { SuspenseWrappedPromise } from '#src/lib/wrapPromiseForSuspense'
import { wrapPromiseForSuspense } from '#src/lib/wrapPromiseForSuspense'
import SourcePortsDialog from '#src/sourcePorts/SourcePortsDialog'

import UpdateNotifier from './UpdateNotifier'

function App() {
  return (
    <Suspense
      fallback={
        <Box padding={4} justifyContent="center">
          <CircularProgress />
        </Box>
      }
    >
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

            <GameList />
          </AppToolbarProvider>
        </ImportDropZone>

        <SourcePortsDialog />
        <UpdateNotifier />
      </Initializer>
    </Suspense>
  )
}

function Initializer(props: PropsWithChildren) {
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
