import { ApolloLink, fromPromise } from '@apollo/client'
import { invoke } from '@tauri-apps/api/tauri'
import { GraphQLError, print } from 'graphql'

const tauriGraphqlApolloLink = new ApolloLink((operation) => {
  return fromPromise(
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
          context: operation.getContext(),
        }
      }),
  )
})

export default tauriGraphqlApolloLink
