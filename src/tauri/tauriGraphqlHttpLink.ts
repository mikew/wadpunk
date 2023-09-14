import { createHttpLink } from '@apollo/client'
import { invoke } from '@tauri-apps/api/tauri'

const tauriGraphqlHttpLink = createHttpLink({
  fetch: async (_input, init) => {
    const [responseStr, isOk] = await invoke<[string, boolean]>(
      'plugin:graphql|graphql',
      JSON.parse(String(init?.body)),
    )

    console.log(init?.signal)
    init?.signal?.throwIfAborted()

    return new Response(responseStr, {
      status: isOk ? 200 : 400,
    })
  },
})

export default tauriGraphqlHttpLink
