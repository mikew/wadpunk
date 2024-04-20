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

import { invalidateApolloQuery } from '#src/graphql/graphqlClient'
import { ImportFileDocument } from '#src/graphql/operations'
import { useRootSelector } from '#src/redux/helpers'
import useTauriFileDrop from '#src/tauri/useTauriFileDrop'

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

  const tauriFileDrop = useTauriFileDrop(async (event) => {
    if (isSourcePortsDialogOpen) {
      return
    }

    let i = 0
    for (const file of event.payload) {
      setCurrentImportStatus({
        currentFilePath: file,
        index: i,
        length: event.payload.length,
        status: 'importing',
      })

      await importFile({ variables: { file_path: file } })

      i++
    }

    invalidateApolloQuery(['getGames'])

    setCurrentImportStatus({
      currentFilePath: '',
      index: 0,
      length: 0,
      status: 'done',
    })
    setTimeout(() => {
      setCurrentImportStatus(undefined)
    }, 3_000)
  })

  const currentIndex = currentImportStatus?.index || 0
  const currentLength = currentImportStatus?.length || 1

  const currentFileName = currentImportStatus?.currentFilePath.slice(
    currentImportStatus.currentFilePath.lastIndexOf('/') + 1,
  )

  const message =
    currentImportStatus?.status === 'importing'
      ? `Importing ${currentIndex + 1}/${currentLength}: ${currentFileName}`
      : currentImportStatus?.status === 'done'
      ? 'Done!'
      : undefined

  return (
    <div>
      {props.children}

      <Snackbar
        open={!!currentImportStatus}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Alert
          severity={
            currentImportStatus?.status === 'importing' ? 'info' : 'success'
          }
        >
          <Stack width={300} direction="column" spacing={1}>
            <div>{message}</div>

            <LinearProgress
              variant="buffer"
              color="inherit"
              value={(currentIndex / currentLength) * 100}
              valueBuffer={((currentIndex + 1) / currentLength) * 100}
            />
          </Stack>
        </Alert>
      </Snackbar>

      <Dialog
        open={Boolean(!isSourcePortsDialogOpen && tauriFileDrop.isDraggingOver)}
      >
        <DialogContent>Drop to import Games ...</DialogContent>
      </Dialog>
    </div>
  )
}

export default ImportDropZone
