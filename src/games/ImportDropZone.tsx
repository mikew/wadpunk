import { Dialog, DialogContent } from '@mui/material'

import Translate from '#src/i18n/Translate'
import { useRootDispatch, useRootSelector } from '#src/redux/helpers'
import useTauriFileDrop from '#src/tauri/useTauriFileDrop'

import type { ImportQueueItem } from './redux'
import { actions } from './redux'

const ImportDropZone: React.FC<React.PropsWithChildren> = (props) => {
  const isSourcePortsDialogOpen = useRootSelector(
    (state) => state.sourcePorts.isDialogOpen,
  )
  const dispatch = useRootDispatch()

  const tauriFileDrop = useTauriFileDrop(async (event) => {
    if (isSourcePortsDialogOpen) {
      return
    }

    const importQueueItems = event.paths.map((filePath) => {
      const item: ImportQueueItem = {
        action: 'import',
        filePath,
      }

      return item
    })

    dispatch(actions.addToImportQueue(importQueueItems))
  })

  return (
    <div>
      {props.children}

      <Dialog
        open={Boolean(!isSourcePortsDialogOpen && tauriFileDrop.isDraggingOver)}
      >
        <DialogContent>
          <Translate scope="games.actions.dropToImport" />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ImportDropZone
