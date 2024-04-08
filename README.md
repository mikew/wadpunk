# WADPunk

A wad organizer / GZDoom launcher inspired by [Doom Launcher](https://github.com/nstlaurent/DoomLauncher)

![](https://raw.githubusercontent.com/mikew/wadpunk/readme-resources/src/game%20list.png)

| ![](https://raw.githubusercontent.com/mikew/wadpunk/readme-resources/src/game%20dialog%20cult%20of%20despair.png) | ![](https://raw.githubusercontent.com/mikew/wadpunk/readme-resources/src/game%20dialog%20golden%20souls%202.png) | ![](https://raw.githubusercontent.com/mikew/wadpunk/readme-resources/src/game%20dialog%20doom%202.png) |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |

## Installation

[Download the latest release](https://github.com/mikew/wadpunk/releases/latest).

WADPunk will check for updates when starting.

### Getting Started

The app will walk you through downloading GZDoom and Freedom.

The idea is, you put your .wad files in your Games folder. WADPunk will read all
those files and folders and present them as Games which you launch in a Source
Port

Games can be tagged with anything you want, and some default tags are included.
`iwad` is a special tag used so WADPunk knows which IWAD to use when launching
your game. Anything tagged with that will be presented for you to choose from when launching a game.

You can then launch those games and:

- Choose from multiple of your source ports.
- Save files are separated per Game.
- Optionally use a separate config from all of your other Games.
- Easily add other .wads.
- Choose from any of your IWADs.
- Drag + drop to sort all files.
- Supports .deh and .bex files.

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
