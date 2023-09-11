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

To add new types, queries, or mutations, edit `schema.graphql` and run
`./script/prepare-env`.

After adding new Queries / Mutations, or "complex" fields, you might need to
implement the method in `./src-tauri/src/datasource/mod.rs`. You can find a
reference implementation in `./src-tauri/src/graphql/datasource_impl.rs`
