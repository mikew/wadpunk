import { Field, FieldProps, FieldRenderProps } from 'react-final-form'

function identity<T>(value: T) {
  return value
}

/**
 * This wraps react-final-form's <Field/> component.
 * The identity function ensures form values never get set to null,
 * but rather, empty strings.
 *
 * See https://github.com/final-form/react-final-form/issues/130
 */
function IdentityField<
  FieldValue = any,
  T extends HTMLElement = HTMLElement,
  InputValue = FieldValue,
  RP extends FieldRenderProps<FieldValue, T, InputValue> = FieldRenderProps<
    FieldValue,
    T,
    InputValue
  >,
>(props: FieldProps<FieldValue, RP, T, InputValue>) {
  return (
    <Field
      // @ts-expect-error
      parse={identity}
      {...props}
    />
  )
}

export default IdentityField
