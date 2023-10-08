import { Button, ButtonProps } from '@mui/material'
import { useForm } from 'react-final-form'

interface FinalFormResetButtonProps extends Omit<ButtonProps, 'onClick'> {}

const FinalFormResetButton: React.FC<FinalFormResetButtonProps> = (props) => {
  const api = useForm()

  return (
    <Button
      {...props}
      onClick={() => {
        api.reset()
      }}
    />
  )
}

export default FinalFormResetButton
