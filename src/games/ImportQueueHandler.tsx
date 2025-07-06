import { useMutation } from '@apollo/client'
import { invariant } from '@apollo/client/utilities/globals'
import { Alert, LinearProgress, Snackbar, Stack } from '@mui/material'
import { useEffect, useRef, useState } from 'react'

import { ImportFileDocument } from '#src/app/operations.generated'
import useLatest from '#src/lib/useLatest'
import { useRootDispatch, useRootSelector } from '#src/redux/helpers'

import type { ImportQueueItem } from './redux'
import { actions } from './redux'

const ImportQueueHandler: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [open, setOpen] = useState(false)

  const lastGameIdRef = useRef<string | null | undefined>(null)

  const dispatch = useRootDispatch()
  const currentBatchTotal = useRootSelector(
    (state) => state.games.currentBatchTotal,
  )
  const currentBatchProcessed = useRootSelector(
    (state) => state.games.currentBatchProcessed,
  )
  const importQueue = useRootSelector((state) => state.games.importQueue)

  const [importFile] = useMutation(ImportFileDocument)

  const processItem = useLatest(async (item: ImportQueueItem) => {
    switch (item.action) {
      case 'import': {
        const { data } = await importFile({
          variables: {
            file_path: item.filePath,
          },
        })

        lastGameIdRef.current = data?.importFile.game_id

        break
      }

      default:
        console.error(`Unknown action: ${item.action}`)
    }
  })

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    async function run() {
      if (isProcessing) {
        return
      }

      if (importQueue.length > 0) {
        setOpen(true)
        setIsProcessing(true)

        const item = importQueue[0]
        invariant(item, 'Expected importQueue to have at least one item')

        await processItem.current(item)

        dispatch(actions.removeImportQueueItem())
        // setProcessedCount((count) => count + 1)
        setIsProcessing(false)
      } else {
        timeoutId = setTimeout(() => {
          setOpen(false)

          if (lastGameIdRef.current) {
            dispatch(actions.setSelectedId(lastGameIdRef.current))
            lastGameIdRef.current = null
          }
        }, 1_000)
      }
    }

    run()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [importQueue, isProcessing, dispatch, processItem])

  const progressPercent =
    currentBatchTotal === 0
      ? 0
      : Math.round((currentBatchProcessed / currentBatchTotal) * 100)

  // const message =
  //   currentImportStatus?.status === 'importing'
  //     ? `Importing ${currentIndex + 1}/${currentLength}: ${currentFileName}`
  //     : currentImportStatus?.status === 'done'
  //       ? 'Done!'
  //       : undefined

  return (
    <Snackbar
      // open={!!currentImportStatus}
      open={open}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
    >
      <Alert
        severity={
          // currentImportStatus?.status === 'importing' ? 'info' : 'success'
          'info'
        }
      >
        {JSON.stringify(importQueue)}
        <Stack width={300} direction="column" spacing={1}>
          {/*<div>{message}</div>*/}

          <LinearProgress
            variant="buffer"
            color="inherit"
            value={progressPercent}
          // value={(currentIndex / currentLength) * 100}
          // valueBuffer={((currentIndex + 1) / currentLength) * 100}
          />
        </Stack>
      </Alert>
    </Snackbar>
  )
}

export default ImportQueueHandler
