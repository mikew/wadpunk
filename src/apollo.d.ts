import type { GraphQLCodegenDataMasking } from '@apollo/client/masking'

declare module '@apollo/client' {
  export interface TypeOverrides
    extends GraphQLCodegenDataMasking.TypeOverrides {}
}
