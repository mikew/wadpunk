import { Button, ButtonProps } from '@mui/material'
import { useForm, useFormState } from 'react-final-form'

interface FinalFormSubmitButtonProps extends Omit<ButtonProps, 'onClick'> {
  onDidSave?: () => void
}

const FinalFormSubmitButton: React.FC<FinalFormSubmitButtonProps> = ({
  onDidSave,
  ...props
}) => {
  const api = useForm()
  const formState = useFormState({
    subscription: {
      submitting: true,
      hasValidationErrors: true,
      pristine: true,
    },
  })

  return (
    <Button
      {...props}
      disabled={
        formState.submitting ||
        formState.hasValidationErrors ||
        formState.pristine
      }
      onClick={async () => {
        try {
          await api.submit()
          onDidSave?.()
        } catch (err) {
          console.error(err)
        }
      }}
    />
  )
}

export default FinalFormSubmitButton
