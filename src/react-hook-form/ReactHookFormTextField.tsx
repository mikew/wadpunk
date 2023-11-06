import { TextField, type TextFieldProps } from '@mui/material'
import {
  Controller,
  type FieldValues,
  type ControllerProps,
} from 'react-hook-form'

// import { useI18nContext } from '@src/i18n/lib/i18nContext'

export interface ReactHookFormTextFieldProps<
  T extends FieldValues = FieldValues,
> extends Omit<
      TextFieldProps,
      'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'name'
    >,
    Pick<
      ControllerProps<T>,
      'name' | 'rules' | 'shouldUnregister' | 'disabled'
    > {
  shouldTranslateErrorMessage?: boolean
}

const ReactHookFormTextField: React.FC<ReactHookFormTextFieldProps> = (
  props,
) => {
  const { name, rules, shouldUnregister, disabled, ...textFieldProps } = props
  // const { t } = useI18nContext()

  return (
    <Controller
      name={props.name}
      disabled={props.disabled}
      rules={props.rules}
      shouldUnregister={props.shouldUnregister}
      render={(renderProps) => {
        const isDisabled = props.disabled || renderProps.formState.isSubmitting
        const errorMessage = renderProps.fieldState.error?.message
        const hasError = Boolean(renderProps.fieldState.error)
        const helperText = errorMessage || props.helperText
        // const helperText = errorMessage
        //   ? props.shouldTranslateErrorMessage !== false
        //     ? t(errorMessage)
        //     : errorMessage
        //   : props.helperText

        return (
          <TextField
            {...textFieldProps}
            {...renderProps.field}
            disabled={isDisabled}
            error={hasError}
            helperText={helperText}
            value={renderProps.field.value ?? null}
          />
        )
      }}
    />
  )
}

export default ReactHookFormTextField
