import { useMutation } from '@apollo/client'
import { Delete, Download, Edit, Terminal } from '@mui/icons-material'
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'

import { invalidateApolloQuery } from '#src/graphql/graphqlClient'
import {
  CreateSourcePortDocument,
  DeleteSourcePortDocument,
} from '#src/graphql/operations'
import { useI18nContext } from '#src/i18n/lib/i18nContext'
import DelayedOnCloseDialog, {
  DelayedOnCloseDialogCloseButton,
} from '#src/mui/DelayedOnCloseDialog'
import ReactHookFormTextField from '#src/react-hook-form/ReactHookFormTextField'
import { useRootDispatch, useRootSelector } from '#src/redux/helpers'

import actions from './actions'
import useAllSourcePorts from './useAllSourcePorts'

interface AddSourcePortFormValues {
  id: string
  command: string
}

const SourcePortsDialog: React.FC = () => {
  const { sourcePorts } = useAllSourcePorts()
  const isOpen = useRootSelector((state) => state.sourcePorts.isDialogOpen)
  const dispatch = useRootDispatch()
  const [createSourcePort] = useMutation(CreateSourcePortDocument)
  const [deleteSourcePort] = useMutation(DeleteSourcePortDocument)
  const formApi = useForm<AddSourcePortFormValues>({
    defaultValues: {
      id: '',
      command: '',
    },
  })
  const { t } = useI18nContext()

  return (
    <DelayedOnCloseDialog
      open={isOpen}
      onClose={() => {
        dispatch(actions.toggleDialog())
      }}
    >
      <DialogTitle>{t('sourcePorts.title')}</DialogTitle>
      <DialogContent>
        {sourcePorts.map((x) => {
          return (
            <ListItem
              key={x.id}
              secondaryAction={
                <IconButton
                  onClick={async () => {
                    await deleteSourcePort({
                      variables: {
                        id: x.id,
                      },
                    })
                    invalidateApolloQuery(['getSourcePorts'])
                  }}
                >
                  <Delete />
                </IconButton>
              }
            >
              <ListItemText primary={x.id} secondary={x.command.join(' ')} />
            </ListItem>
          )
        })}

        <Typography>{t('sourcePorts.addNew')}</Typography>
        <FormProvider {...formApi}>
          <ReactHookFormTextField
            name="id"
            label={t('sourcePorts.fields.id.label')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Edit />
                </InputAdornment>
              ),
            }}
          />
          <ReactHookFormTextField
            name="command"
            label={t('sourcePorts.fields.command.label')}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Terminal fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            onClick={formApi.handleSubmit(async (values) => {
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

              invalidateApolloQuery(['getSourcePorts'])
              formApi.reset()
            })}
          >
            {t('sourcePorts.actions.create')}
          </Button>
        </FormProvider>
      </DialogContent>
      <DialogActions>
        <Button
          startIcon={<Download />}
          href="https://zdoom.org/downloads"
          target="_blank"
        >
          {t('sourcePorts.downloadGZDoom')}
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <DelayedOnCloseDialogCloseButton>
          {t('shared.close')}
        </DelayedOnCloseDialogCloseButton>
      </DialogActions>
    </DelayedOnCloseDialog>
  )
}

export default SourcePortsDialog
