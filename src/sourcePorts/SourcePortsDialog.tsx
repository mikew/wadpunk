import { useMutation } from '@apollo/client'
import { Add, Download } from '@mui/icons-material'
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { useMemo, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { invalidateApolloQuery } from '#src/graphql/graphqlClient'
import {
  CreateSourcePortDocument,
  DeleteSourcePortDocument,
  UpdateSourcePortDocument,
} from '#src/graphql/operations'
import { useI18nContext } from '#src/i18n/lib/i18nContext'
import basename from '#src/lib/basename'
import { useConfirmDialog } from '#src/lib/ConfirmDialog'
import DelayedOnCloseDialog, {
  DelayedOnCloseDialogTitleWithCloseIcon,
} from '#src/mui/DelayedOnCloseDialog'
import { useRootDispatch, useRootSelector } from '#src/redux/helpers'
import useTauriFileDrop from '#src/tauri/useTauriFileDrop'

import actions from './actions'
import type { AddSourcePortFormValues } from './SourcePortForm'
import SourcePortForm from './SourcePortForm'
import useAllSourcePorts from './useAllSourcePorts'

const SourcePortsDialog: React.FC = () => {
  const { sourcePorts } = useAllSourcePorts()
  const isOpen = useRootSelector((state) => state.sourcePorts.isDialogOpen)
  const dispatch = useRootDispatch()
  const [createSourcePort] = useMutation(CreateSourcePortDocument)
  const [updateSourcePort] = useMutation(UpdateSourcePortDocument)
  const [deleteSourcePort] = useMutation(DeleteSourcePortDocument)
  const selectedId = useRootSelector((state) => state.sourcePorts.selectedId)
  const selectedSourcePort = useMemo(() => {
    return sourcePorts.find((x) => x.id === selectedId)
  }, [selectedId, sourcePorts])
  const { confirm } = useConfirmDialog()
  const formRef = useRef<UseFormReturn<AddSourcePortFormValues> | null>(null)

  const { t } = useI18nContext()
  const isAddingNew = selectedId === '-1'

  const tauriFileDrop = useTauriFileDrop(async (event) => {
    if (!isOpen) {
      return
    }

    formRef.current?.setValue('id', basename(event.payload[0] || ''))
    formRef.current?.setValue('command', event.payload[0] || '')
  })

  return (
    <>
      <DelayedOnCloseDialog
        open={isOpen}
        maxWidth="lg"
        fullWidth
        onClose={() => {
          dispatch(actions.toggleDialog())
        }}
      >
        <DelayedOnCloseDialogTitleWithCloseIcon>
          {t('sourcePorts.title')}
        </DelayedOnCloseDialogTitleWithCloseIcon>

        <DialogContent>
          <Stack
            direction="row"
            spacing={2}
            divider={<Divider orientation="vertical" flexItem />}
          >
            <Box sx={{ width: '300px' }}>
              <List dense disablePadding>
                <ListItem divider disablePadding>
                  <ListItemButton
                    onClick={() => {
                      dispatch(actions.setSelectedId('-1'))
                    }}
                    selected={isAddingNew}
                  >
                    <ListItemText primary={<strong>Add New</strong>} />
                    <Add />
                  </ListItemButton>
                </ListItem>

                {sourcePorts.map((x) => {
                  return (
                    <ListItem key={x.id} disablePadding divider>
                      <ListItemButton
                        selected={selectedId === x.id}
                        onClick={() => {
                          dispatch(actions.setSelectedId(x.id))
                        }}
                      >
                        <ListItemText
                          primary={x.id}
                          secondaryTypographyProps={{
                            sx: { wordWrap: 'break-word' },
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  )
                })}
              </List>

              <Divider />

              <Box textAlign="center">
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                  sx={{ marginTop: 1 }}
                >
                  Don't know where to get started?
                </Typography>

                <Button
                  startIcon={<Download />}
                  href="https://zdoom.org/downloads"
                  target="_blank"
                >
                  {t('sourcePorts.downloadGZDoom')}
                </Button>
              </Box>
            </Box>

            <Box style={{ flexGrow: '1' }}>
              <SourcePortForm
                // key is needed here for react-hook-form. Without it, even though
                // new objects are passed to `defaultValues`, it never reflects
                // them in the fields.
                // We also can't just use `selectedId` because there's a period
                // where that is set but `selectedSourcePort` is null because the
                // query is still loading. This way ensures the key changes when
                // `selectedSourcePort` does.
                key={selectedSourcePort ? selectedSourcePort.id : '-1'}
                ref={formRef}
                sourcePort={
                  selectedSourcePort
                    ? {
                        ...selectedSourcePort,
                        command: selectedSourcePort.command[0] || '',
                      }
                    : {
                        id: '',
                        command: '',
                      }
                }
                onClickSave={async (values, formApi) => {
                  if (isAddingNew) {
                    await createSourcePort({
                      variables: {
                        source_port: {
                          id: values.id,
                          // TODO This is a hack because I don't want to deal with the
                          // array-ness of the command in the UI yet.
                          command: values.command ? [values.command] : [],
                        },
                      },
                    })

                    formApi.reset()

                    invalidateApolloQuery(['getSourcePorts'])

                    dispatch(actions.setSelectedId(values.id))
                  } else {
                    await updateSourcePort({
                      variables: {
                        source_port: {
                          id: selectedId,
                          command: values.command ? [values.command] : [],
                        },
                      },
                    })

                    invalidateApolloQuery(['getSourcePorts'])
                  }
                }}
                onDeleteClick={async () => {
                  if (
                    await confirm({
                      title: t('sourcePorts.confirmDelete.title'),
                      message: t('sourcePorts.confirmDelete.message'),
                      confirmLabel: t('shared.delete'),
                      // cancelLabel: t('shared.cancel'),
                    })
                  ) {
                    await deleteSourcePort({
                      variables: { id: selectedId },
                    })
                    dispatch(actions.setSelectedId('-1'))
                    invalidateApolloQuery(['getSourcePorts'])
                  }
                }}
              />
            </Box>
          </Stack>
        </DialogContent>
      </DelayedOnCloseDialog>

      <Dialog open={Boolean(isOpen && tauriFileDrop.isDraggingOver)}>
        <DialogContent>{t('sourcePorts.actions.dropToImport')}</DialogContent>
      </Dialog>
    </>
  )
}

export default SourcePortsDialog
