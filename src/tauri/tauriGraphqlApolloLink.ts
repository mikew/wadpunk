import { ApolloLink } from '@apollo/client'
import { invoke } from '@tauri-apps/api/core'
import { GraphQLError, print } from 'graphql'
import { from } from 'rxjs'

const tauriGraphqlApolloLink = new ApolloLink((operation) => {
  return from(
    invoke<[string, boolean]>('plugin:graphql|graphql', {
      query: print(operation.query),
      variables: operation.variables,
    })
      .then(([responseStr]) => {
        const parsed = JSON.parse(responseStr)

        return {
          data: parsed.data,
          errors: parsed.errors,
        }
      })
      .catch((err) => {
        console.error(err)

        return {
          errors: [new GraphQLError(String(err))],
        }
      }),
  )
})

export default tauriGraphqlApolloLink
