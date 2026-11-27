import { useMutation } from '@apollo/client/react'
import { invariant } from '@apollo/client/utilities/invariant'
import { Alert, LinearProgress, Snackbar, Stack } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useEffect, useRef, useState } from 'react'

import { ImportFileDocument } from '#src/app/operations.generated'
import { handleErrorLocallyContext } from '#src/graphql/context'
import useInvalidateApolloCache from '#src/graphql/useInvalidateApolloCache'
import { useI18nContext } from '#src/i18n/lib/i18nContext'
import basename from '#src/lib/basename'
import useLatest from '#src/lib/useLatest'
import { useRootDispatch, useRootSelector } from '#src/redux/helpers'

import { DownloadGameDocument } from './operations.generated'
import type { ImportQueueItem } from './redux'
import { actions } from './redux'

function describeImportItem(item: ImportQueueItem) {
  switch (item.action) {
    case 'import':
      return basename(item.filePath)

    case 'download':
      return item.hint ? `${item.host} (${item.hint})` : item.host
  }
}

const ImportQueueHandler: React.FC = () => {
  const { t } = useI18nContext()
  const [isProcessing, setIsProcessing] = useState(false)
  const [open, setOpen] = useState(false)
  const [currentImportItem, setCurrentImportItem] = useState<
    ImportQueueItem | 'DONE'
  >('DONE')

  const lastGameIdRef = useRef<string | null | undefined>(null)

  const dispatch = useRootDispatch()
  const currentBatchTotal = useRootSelector(
    (state) => state.games.currentBatchTotal,
  )
  const currentBatchProcessed = useRootSelector(
    (state) => state.games.currentBatchProcessed,
  )
  const importQueue = useRootSelector((state) => state.games.importQueue)

  const { invalidateApolloQuery } = useInvalidateApolloCache()
  const [importFile] = useMutation(ImportFileDocument)
  const [downloadGame] = useMutation(DownloadGameDocument)

  async function importItem(item: ImportQueueItem) {
    switch (item.action) {
      case 'import': {
        const { data } = await importFile({
          variables: {
            file_path: item.filePath,
          },
          context: handleErrorLocallyContext,
        })

        lastGameIdRef.current = data?.importFile.game_id

        break
      }

      case 'download': {
        const { data: downloadGameData } = await downloadGame({
          variables: {
            host: item.host,
            hint: item.hint,
          },
          context: handleErrorLocallyContext,
        })

        if (!downloadGameData?.downloadGame?.temp_path) {
          console.error('No temp_path returned from downloadGame mutation')
          break
        }

        const { data: importFileData } = await importFile({
          variables: {
            file_path: downloadGameData.downloadGame.temp_path,
          },
          context: handleErrorLocallyContext,
        })

        lastGameIdRef.current = importFileData?.importFile.game_id

        break
      }

      default:
        console.error(`Unknown action: ${item}`)
    }
  }

  const processItem = useLatest(async (item: ImportQueueItem) => {
    try {
      await importItem(item)
    } catch (err) {
      console.error('Failed to import:', err)

      enqueueSnackbar(
        t('games.notifications.importError', {
          name: describeImportItem(item),
          message:
            err instanceof Error
              ? err.message
              : t('games.notifications.unknownError'),
        }),
        { variant: 'error' },
      )
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

        setCurrentImportItem(item)

        await processItem.current(item)

        dispatch(actions.removeImportQueueItem())
        // setProcessedCount((count) => count + 1)
        setIsProcessing(false)
      } else {
        setCurrentImportItem('DONE')
        invalidateApolloQuery(['getGames'])

        if (lastGameIdRef.current) {
          dispatch(actions.setSelectedId(lastGameIdRef.current))
          lastGameIdRef.current = null
        }

        timeoutId = setTimeout(() => {
          setOpen(false)
        }, 3_000)
      }
    }

    run()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [importQueue, isProcessing, dispatch, processItem, invalidateApolloQuery])

  const progressPercent =
    currentImportItem === 'DONE'
      ? 100
      : currentBatchTotal === 0
        ? 0
        : (currentBatchProcessed / currentBatchTotal) * 100

  const progressBufferPercent =
    currentImportItem === 'DONE'
      ? 100
      : currentBatchTotal === 0
        ? 0
        : ((currentBatchProcessed + 1) / currentBatchTotal) * 100

  const currentImportHint =
    currentImportItem === 'DONE' ? '' : describeImportItem(currentImportItem)
  const message =
    currentImportItem === 'DONE'
      ? 'Done!'
      : `Importing ${currentBatchProcessed + 1}/${currentBatchTotal}: ${currentImportHint}`

  return (
    <Snackbar
      open={open}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
    >
      <Alert severity={currentImportItem === 'DONE' ? 'success' : 'info'}>
        <Stack
          direction="column"
          spacing={1}
          sx={{
            width: 300,
          }}
        >
          <div>{message}</div>

          <LinearProgress
            variant="buffer"
            color="inherit"
            value={progressPercent}
            valueBuffer={progressBufferPercent}
          />
        </Stack>
      </Alert>
    </Snackbar>
  )
}

export default ImportQueueHandler
