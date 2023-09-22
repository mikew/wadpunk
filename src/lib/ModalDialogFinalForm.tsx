import { Dialog, DialogProps } from '@mui/material'
import { forwardRef } from 'react'
import { useForm } from 'react-final-form'

interface ModalDialogFinalFormProps
  extends Omit<DialogProps, 'component' | 'onSubmit' | 'onReset'> {}

const ModalDialogFinalForm: React.FC<ModalDialogFinalFormProps> = forwardRef(
  (props, ref) => {
    const api = useForm()

    return (
      <Dialog
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
