type WrappedPromiseStatus = 'pending' | 'success' | 'error'

export interface SuspenseWrappedPromise<T> {
  read: () => { result: T; status: WrappedPromiseStatus } | undefined
}

export function wrapPromiseForSuspense<T>(promise: Promise<T>) {
  let status: 'pending' | 'success' | 'error' = 'pending'
  let result: T
  let err: unknown

  const suspender = promise.then(
    (value) => {
      status = 'success'
      result = value
    },
    (e) => {
      status = 'error'
      err = e
    },
  )

  const wrappedPromise: SuspenseWrappedPromise<T> = {
    read() {
      if (status === 'pending') {
        throw suspender
      } else if (status === 'error') {
        throw err
      } else if (status === 'success') {
        return { status, result }
      }
    },
  }

  return wrappedPromise
}
