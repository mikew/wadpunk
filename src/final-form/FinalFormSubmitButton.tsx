import { Button, ButtonProps } from '@mui/material'
import { useForm } from 'react-final-form'

interface FinalFormSubmitButtonProps extends Omit<ButtonProps, 'onClick'> {
  onDidSave?: () => void
}

const FinalFormSubmitButton: React.FC<FinalFormSubmitButtonProps> = (props) => {
  const api = useForm()

  return (
    <Button
      {...props}
      onClick={async () => {
        try {
          await api.submit()
          props.onDidSave?.()
        } catch (err) {
          console.error(err)
        }
      }}
    />
  )
}

export default FinalFormSubmitButton
