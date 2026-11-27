import pbxxBase from '@promoboxx/eslint-config'
import pbxxGraphqlOperations from '@promoboxx/eslint-config/graphql-operations'
import pbxxGraphqlSchema from '@promoboxx/eslint-config/graphql-schema'
import pbxxPrettier from '@promoboxx/eslint-config/prettier'
import pbxxReact from '@promoboxx/eslint-config/react'
import pbxxVitest from '@promoboxx/eslint-config/vitest'
import { defineConfig, globalIgnores } from 'eslint/config'

const config = defineConfig([
  globalIgnores([
    'src/graphql/types.d.ts',
    '**/*.generated.ts',
    'src/routeTree.gen.ts',
  ]),

  // Base config applies to all projects.
  ...pbxxBase,

  // If the project uses vitest:
  ...pbxxVitest,

  // If the project uses react:
  ...pbxxReact,

  // If the project uses graphql operations
  ...pbxxGraphqlOperations,

  // If the project uses graphql schema
  ...pbxxGraphqlSchema,

  // If the project uses prettier:
  ...pbxxPrettier,

  {
    languageOptions: {
      parserOptions: {
        graphQLConfig: {
          // If the project uses graphql, set the path/url to your schema below.
          skipGraphQLConfig: true,
          schema: './graphql-schema.json',
          documents: ['**/*.operations.graphql', '**/operations.graphql'],
        },
      },
    },
  },

  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@mui/icons-material',
              message:
                "Import each icon from its own path, e.g. `import Add from '@mui/icons-material/Add'`. The package index loads every icon (~10k files) when the SPA shell is prerendered in Node, which runs out of file handles in CI.",
            },
          ],
        },
      ],
    },
  },
])

export default config
