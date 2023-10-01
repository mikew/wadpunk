# gzdoom-launcher

A wad organizer / GZDoom launcher inspired by [Doom Launcher](https://github.com/nstlaurent/DoomLauncher)

## Development

The UI lives in `src/`, while the backend lives in `./src-tauri/src`.

### Getting Started

```sh
./script/start
```

### GraphQL

Communication between the UI and backend is done via GraphQL.

#### Rust

To add new types, queries, or mutations, edit `schema.graphql` and run
`./script/prepare-env`.

After adding new Queries / Mutations, or "complex" fields, you might need to
implement the method in `./src-tauri/src/graphql/datasource.rs`. You can find a
reference implementation in `./src-tauri/src/graphql/datasource_impl.rs`

#### UI

Edit a file named `operations.graphql` in the directory of the feature.

Say for example you made this operation:

```graphql
query Example {
  getGames {
    id
    name
  }
}
```

Then you would use it like:

```ts
const { data } = useSuspenseQuery(ExampleDocument)
```

And if you'd like, an interface for the response would be available as
`ExampleQuery`, and an interface for the variables would be available as
`ExampleQueryVariables`.

For a mutation, it's exactly the same, except instead of `Query` in the names
above it would be `Mutation,
