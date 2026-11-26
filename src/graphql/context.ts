import type { DefaultContext } from '@apollo/client'

declare module '@apollo/client' {
  interface DefaultContext {
    handleErrorLocally?: boolean
  }
}

export const handleErrorLocallyContext: DefaultContext = {
  handleErrorLocally: true,
}
