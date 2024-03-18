type WrappedPromiseStatus = 'pending' | 'success' | 'error'

export interface SuspenseWrappedPromise<T> {
  read: () => { result: T; status: WrappedPromiseStatus } | never
}

export function wrapPromiseForSuspense<T>(promise: Promise<T>) {
  let status: WrappedPromiseStatus = 'pending'
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
      switch (status) {
        case 'pending':
          throw suspender
        case 'error':
          throw err
        case 'success':
          return { status, result }
      }
    },
  }

  return wrappedPromise
}
