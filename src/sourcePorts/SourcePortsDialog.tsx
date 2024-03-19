import { useMutation } from '@apollo/client'
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'

import { CreateSourcePortDocument } from '#src/graphql/operations'
import DelayedOnCloseDialog, {
  DelayedOnCloseDialogCloseButton,
} from '#src/lib/DelayedOnCloseDialog'
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
  const formApi = useForm<AddSourcePortFormValues>({
    defaultValues: {
      id: '',
      command: '',
    },
  })

  return (
    <DelayedOnCloseDialog
      open={isOpen}
      onClose={() => {
        dispatch(actions.toggleDialog())
      }}
    >
      <DialogTitle>Source Ports</DialogTitle>
      <DialogContent>
        {sourcePorts.map((x) => {
          return (
            <ListItem key={x.id}>
              <ListItemText primary={x.id} secondary={x.command.join(' ')} />
            </ListItem>
          )
        })}

        <Typography>Add New</Typography>
        <FormProvider {...formApi}>
          <ReactHookFormTextField name="id" label="Name" />
          <ReactHookFormTextField name="command" label="Command" size="small" />

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
            Create
          </Button>
        </FormProvider>
      </DialogContent>
      <DialogActions>
        <DelayedOnCloseDialogCloseButton>Close</DelayedOnCloseDialogCloseButton>
      </DialogActions>
    </DelayedOnCloseDialog>
  )
}

export default SourcePortsDialog
