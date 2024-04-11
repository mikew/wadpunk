# WADPunk

[Download the latest release](https://github.com/mikew/wadpunk/releases/latest).

WADPunk is a cross-platform app to help you manage your WAD library and launch
Source Ports like GZDoom.

![](https://raw.githubusercontent.com/mikew/wadpunk/readme-resources/src/game%20list.png)

| ![](https://raw.githubusercontent.com/mikew/wadpunk/readme-resources/src/game%20dialog%20cult%20of%20despair.png) | ![](https://raw.githubusercontent.com/mikew/wadpunk/readme-resources/src/game%20dialog%20golden%20souls%202.png) | ![](https://raw.githubusercontent.com/mikew/wadpunk/readme-resources/src/game%20dialog%20doom%202.png) |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |

The idea is you have a Games folder filled with `.wad` files or folders. WADPunk
will read everything in that folder and present them as Games which you launch
in a Source Port.

Games can be tagged with anything you want, and some default tags are included.
`iwad` is a special tag used so WADPunk knows which IWAD to use when launching
your game. Anything tagged with that will be presented for you to choose from
when launching a game.

You can then launch those games and:

- Specify a Source Port.
- Separate save files.
- Use a separate config (optional).
- Easily add other .wads.
- Choose from any of your IWADs.
- Drag + drop to sort all files.
- Specify .deh and .bex files.

WADPunk was inspired by [Doom Launcher](https://github.com/nstlaurent/DoomLauncher).

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
