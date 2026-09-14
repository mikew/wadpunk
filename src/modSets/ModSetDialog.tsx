import { useMutation } from '@apollo/client'
import { Add } from '@mui/icons-material'
import {
  Box,
  DialogContent,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
} from '@mui/material'
import { useMemo, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { invalidateApolloQuery } from '#src/graphql/graphqlClient'
import { useI18nContext } from '#src/i18n/lib/i18nContext'
import { useConfirmDialog } from '#src/lib/ConfirmDialog'
import DelayedOnCloseDialog, {
  DelayedOnCloseDialogTitleWithCloseIcon,
} from '#src/mui/DelayedOnCloseDialog'
import { useRootDispatch, useRootSelector } from '#src/redux/helpers'

import actions from './actions'
import type { AddModSetFormValues } from './ModSetForm'
import ModSetForm from './ModSetForm'
import { useModSetsContext } from './modSetsContext'
import {
  CreateModSetDocument,
  DeleteModSetDocument,
  UpdateModSetDocument,
} from './operations.generated'

const ModSetDialog: React.FC = () => {
  const { modSets } = useModSetsContext()
  const isOpen = useRootSelector((state) => state.modSets.isDialogOpen)
  const dispatch = useRootDispatch()
  const selectedName = useRootSelector((state) => state.modSets.selectedName)
  const [createModSet] = useMutation(CreateModSetDocument)
  const [updateModSet] = useMutation(UpdateModSetDocument)
  const [deleteModSet] = useMutation(DeleteModSetDocument)

  const selectedModSet = useMemo(() => {
    return modSets.find((x) => x.name === selectedName)
  }, [selectedName, modSets])

  const formRef = useRef<UseFormReturn<AddModSetFormValues> | null>(null)

  const { t } = useI18nContext()
  const { confirm } = useConfirmDialog()
  const isAddingNew = selectedName === '-1'

  return (
    <DelayedOnCloseDialog
      open={isOpen}
      maxWidth="lg"
      fullWidth
      onClose={() => {
        dispatch(actions.toggleDialog())
      }}
    >
      <DelayedOnCloseDialogTitleWithCloseIcon>
        {t('modSets.title')}
      </DelayedOnCloseDialogTitleWithCloseIcon>

      <DialogContent>
        <Stack
          direction="row"
          spacing={2}
          divider={<Divider orientation="vertical" flexItem />}
        >
          <Box sx={{ flex: '0 0 300px' }}>
            <List dense disablePadding>
              <ListItem divider disablePadding>
                <ListItemButton
                  onClick={() => {
                    dispatch(actions.setSelectedName('-1'))
                  }}
                  selected={isAddingNew}
                >
                  <ListItemText primary={<strong>Add New</strong>} />
                  <Add />
                </ListItemButton>
              </ListItem>

              {modSets.map((modSet) => {
                return (
                  <ListItem key={modSet.name} disablePadding divider>
                    <ListItemButton
                      selected={selectedName === modSet.name}
                      onClick={() => {
                        dispatch(actions.setSelectedName(modSet.name))
                      }}
                    >
                      <ListItemText
                        primary={modSet.name}
                        secondaryTypographyProps={{
                          sx: { wordWrap: 'break-word' },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                )
              })}
            </List>
          </Box>

          <Box flexGrow="1">
            <ModSetForm
              key={selectedModSet ? selectedModSet.name : '-1'}
              ref={formRef}
              modSet={
                selectedModSet
                  ? {
                      name: selectedModSet.name,
                      mods: selectedModSet.mods,
                    }
                  : {
                      name: '',
                      mods: [],
                    }
              }
              onClickSave={async (values, formApi) => {
                if (isAddingNew) {
                  await createModSet({
                    variables: {
                      mod_set: {
                        name: values.name,
                        mods: values.mods,
                      },
                    },
                  })

                  formApi.reset()

                  invalidateApolloQuery(['getModSets'])

                  dispatch(actions.setSelectedName(values.name))
                } else {
                  await updateModSet({
                    variables: {
                      mod_set: {
                        name: selectedName,
                        mods: values.mods,
                      },
                    },
                  })

                  invalidateApolloQuery(['getModSets'])
                }
              }}
              onDeleteClick={async () => {
                if (
                  await confirm({
                    title: t('modSets.confirmDelete.title'),
                    message: t('modSets.confirmDelete.message'),
                    confirmLabel: t('shared.delete'),
                  })
                ) {
                  await deleteModSet({
                    variables: { name: selectedName },
                  })
                  dispatch(actions.setSelectedName('-1'))
                  invalidateApolloQuery(['getModSets'])
                }
              }}
            />
          </Box>
        </Stack>
      </DialogContent>
    </DelayedOnCloseDialog>
  )
}

export default ModSetDialog
