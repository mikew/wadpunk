import { Dialog, DialogContent } from '@mui/material'

import { useI18nContext } from '#src/i18n/lib/i18nContext'
import { useRootDispatch, useRootSelector } from '#src/redux/helpers'
import useTauriFileDrop from '#src/tauri/useTauriFileDrop'

import type { ImportQueueItem } from './redux'
import { actions } from './redux'

const ImportDropZone: React.FC<React.PropsWithChildren> = (props) => {
  const isSourcePortsDialogOpen = useRootSelector(
    (state) => state.sourcePorts.isDialogOpen,
  )
  const { t } = useI18nContext()
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
        <DialogContent>{t('games.actions.dropToImport')}</DialogContent>
      </Dialog>
    </div>
  )
}

export default ImportDropZone
