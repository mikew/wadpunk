import { useMutation } from '@apollo/client'
import {
  Alert,
  Dialog,
  DialogContent,
  LinearProgress,
  Snackbar,
  Stack,
} from '@mui/material'
import { useState } from 'react'

import { ImportFileDocument } from '#src/app/operations.generated'
import { invalidateApolloQuery } from '#src/graphql/graphqlClient'
import { useI18nContext } from '#src/i18n/lib/i18nContext'
import basename from '#src/lib/basename'
import { useRootDispatch, useRootSelector } from '#src/redux/helpers'
import useTauriFileDrop from '#src/tauri/useTauriFileDrop'

import type { ImportQueueItem } from './redux'
import { actions } from './redux'

interface ImportStatus {
  currentFilePath: string
  index: number
  length: number
  status: 'importing' | 'done'
}

const ImportDropZone: React.FC<React.PropsWithChildren> = (props) => {
  const [currentImportStatus, setCurrentImportStatus] = useState<
    ImportStatus | undefined
  >()
  const [importFile] = useMutation(ImportFileDocument)
  const isSourcePortsDialogOpen = useRootSelector(
    (state) => state.sourcePorts.isDialogOpen,
  )
  const { t } = useI18nContext()
  const dispatch = useRootDispatch()

  const tauriFileDrop = useTauriFileDrop(async (event) => {
    if (isSourcePortsDialogOpen) {
      return
    }

    let lastImportedGameId: string | null | undefined

    const importQueueItems = event.paths.map((filePath) => {
      const item: ImportQueueItem = {
        action: 'import',
        filePath,
      }

      return item
    })

    dispatch(actions.addToImportQueue(importQueueItems))

    let i = 0
    // for (const file of event.paths) {
    //   setCurrentImportStatus({
    //     currentFilePath: file,
    //     index: i,
    //     length: event.paths.length,
    //     status: 'importing',
    //   })

    //   const { data } = await importFile({ variables: { file_path: file } })
    //   lastImportedGameId = data?.importFile?.game_id

    //   i++
    // }

    // invalidateApolloQuery(['getGames'])

    // setCurrentImportStatus({
    //   currentFilePath: '',
    //   index: 0,
    //   length: 0,
    //   status: 'done',
    // })
    // setTimeout(() => {
    //   setCurrentImportStatus(undefined)

    //   if (lastImportedGameId) {
    //     dispatch(actions.setSelectedId(lastImportedGameId))
    //   }
    // }, 3_000)
  })

  const currentIndex = currentImportStatus?.index || 0
  const currentLength = currentImportStatus?.length || 1

  const currentFileName = basename(currentImportStatus?.currentFilePath || '')

  return (
    <div>
      {props.children}

      <Dialog
        open={Boolean(!isSourcePortsDialogOpen && tauriFileDrop.isDraggingOver)}
      >
        <DialogContent>{t('games.actions.dropToImport')}</DialogContent>
      </Dialog>
    </div>
  )
}

export default ImportDropZone
