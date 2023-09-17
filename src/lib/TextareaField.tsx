import { Textarea, TextareaProps } from '@mui/joy'
import { FieldRenderProps } from 'react-final-form'

type TextareaFieldProps = Omit<
  TextareaProps,
  'onChange' | 'onBlur' | 'onFocus' | 'value'
> &
  FieldRenderProps<any>

const TextareaField: React.FC<TextareaFieldProps> = ({
  input,
  meta,
  ...rest
}) => {
  return <Textarea {...input} {...rest} error={meta.touched && meta.error} />
}

export default TextareaField
