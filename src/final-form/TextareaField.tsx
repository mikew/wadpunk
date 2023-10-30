import { TextField, TextFieldProps } from '@mui/material'
import { FieldRenderProps } from 'react-final-form'

type TextareaFieldProps = Omit<
  TextFieldProps,
  'onChange' | 'onBlur' | 'onFocus' | 'value'
> &
  FieldRenderProps<any>

const TextareaField: React.FC<TextareaFieldProps> = ({
  input,
  meta,
  ...rest
}) => {
  return (
    <TextField
      {...input}
      {...rest}
      error={meta.touched && meta.error}
      disabled={rest.disabled || meta.submitting}
    />
  )
}

export default TextareaField
