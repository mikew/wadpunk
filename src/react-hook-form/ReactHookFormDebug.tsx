import { useFormState, useWatch } from 'react-hook-form'

const ReactHookFormDebug = () => {
  const formState = useFormState()
  const allValues = useWatch()

  return (
    <>
      <pre>Values: {JSON.stringify(allValues, undefined, 4)}</pre>
      <pre>Errors: {JSON.stringify(formState.errors, undefined, 4)}</pre>
    </>
  )
}

export default ReactHookFormDebug
