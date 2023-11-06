import { useMutation, useSuspenseQuery } from '@apollo/client'
import {
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import { Form } from 'react-final-form'

import FinalFormSubmitButton from '@src/final-form/FinalFormSubmitButton'
import IdentityField from '@src/final-form/IdentityField'
import TextareaField from '@src/final-form/TextareaField'
import {
  CreateSourcePortDocument,
  GetAllSourcePortsDocument,
} from '@src/graphql/operations'
import DelayedOnCloseDialog, {
  DelayedOnCloseDialogCloseButton,
} from '@src/lib/DelayedOnCloseDialog'
import { useRootDispatch, useRootSelector } from '@src/redux/helpers'

import actions from './actions'

interface AddSourcePortFormValues {
  id: string
  command: string
}

const SourcePortsDialog: React.FC = (props) => {
  const { data, refetch } = useSuspenseQuery(GetAllSourcePortsDocument)
  const isOpen = useRootSelector((state) => state.sourcePorts.isDialogOpen)
  const dispatch = useRootDispatch()
  const [createSourcePort] = useMutation(CreateSourcePortDocument)
  console.log(data)

  return (
    <DelayedOnCloseDialog
      open={isOpen}
      onClose={() => {
        dispatch(actions.toggleDialog())
      }}
    >
      <DialogTitle>Source Ports</DialogTitle>
      <DialogContent>
        {data.getSourcePorts.map((x) => {
          return (
            <ListItem key={x.id}>
              <ListItemText primary={x.id} secondary={x.command.join(' ')} />
            </ListItem>
          )
        })}

        <Typography>Add New</Typography>
        <Form<AddSourcePortFormValues>
          initialValues={{}}
          onSubmit={async (values, api) => {
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

            refetch()
            api.reset()
          }}
        >
          {({ values }) => {
            return (
              <>
                <IdentityField
                  name="id"
                  component={TextareaField}
                  label="Name"
                />

                <IdentityField
                  name="command"
                  component={TextareaField}
                  label="command"
                  size="small"
                />

                <FinalFormSubmitButton fullWidth>Create</FinalFormSubmitButton>
              </>
            )
          }}
        </Form>
      </DialogContent>
      <DialogActions>
        <DelayedOnCloseDialogCloseButton>Close</DelayedOnCloseDialogCloseButton>
      </DialogActions>
    </DelayedOnCloseDialog>
  )
}

export default SourcePortsDialog
