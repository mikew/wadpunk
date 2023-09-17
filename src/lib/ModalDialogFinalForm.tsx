import { ModalDialog, ModalDialogProps } from '@mui/joy'
import { forwardRef } from 'react'
import { useForm } from 'react-final-form'

interface ModalDialogFinalFormProps
  extends Omit<
    ModalDialogProps<'form'>,
    'component' | 'onSubmit' | 'onReset'
  > {}

const ModalDialogFinalForm: React.FC<ModalDialogFinalFormProps> = forwardRef(
  (props, ref) => {
    const api = useForm()

    return (
      <ModalDialog
        {...props}
        component="form"
        onSubmit={(event) => {
          event?.preventDefault()
          api.submit()
        }}
        onReset={(event) => {
          event.preventDefault()
          api.reset()
        }}
      />
    )
  },
)

export default ModalDialogFinalForm
