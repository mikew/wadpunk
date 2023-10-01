import { ApolloClient, InMemoryCache } from '@apollo/client'

import tauriGraphqlApolloLink from '@src/tauri/tauriGraphqlApolloLink'
// import tauriGraphqlHttpLink from '@src/tauri/tauriGraphqlHttpLink'

const graphqlClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: tauriGraphqlApolloLink,
  // link: tauriGraphqlHttpLink,
})

export default graphqlClient
