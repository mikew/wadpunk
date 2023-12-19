import type { TextFieldProps } from '@mui/material'
import { TextField } from '@mui/material'
import type { FieldValues, ControllerProps } from 'react-hook-form'
import { Controller } from 'react-hook-form'

// import { useI18nContext } from '#src/i18n/lib/i18nContext'

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
      render={({ field: { ref, ...field }, fieldState, formState }) => {
        const isDisabled = props.disabled || formState.isSubmitting
        const errorMessage = fieldState.error?.message
        const helperText = errorMessage || props.helperText
        // const helperText = errorMessage
        //   ? props.shouldTranslateErrorMessage !== false
        //     ? t(errorMessage)
        //     : errorMessage
        //   : props.helperText

        return (
          <TextField
            {...textFieldProps}
            {...field}
            disabled={isDisabled}
            error={fieldState.invalid}
            helperText={helperText}
            value={field.value ?? null}
            inputRef={ref}
          />
        )
      }}
    />
  )
}

export default ReactHookFormTextField
