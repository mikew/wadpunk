module.exports = {
  extends: [
    // Base config applies to all projects.
    '@promoboxx/eslint-config',
    // If the project uses prettier:
    '@promoboxx/eslint-config/prettier',
    // If the project uses jest:
    // '@promoboxx/eslint-config/jest',
    // If the project uses react:
    '@promoboxx/eslint-config/react',
    // If the project uses graphql:
    '@promoboxx/eslint-config/graphql',
  ],
  parserOptions: {
    // If the project uses graphql, set the path/url to your schema below.
    // skipGraphQLConfig: true,
    schema: './graphql-schema.json',
  },
}
