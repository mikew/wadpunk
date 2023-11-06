import { useMutation, useSuspenseQuery } from '@apollo/client'
import { Search } from '@mui/icons-material'
import FolderOpen from '@mui/icons-material/FolderOpen'
import {
  AppBar,
  Box,
  Button,
  Chip,
  IconButton,
  Input,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Toolbar,
} from '@mui/material'
import useSimpleFilter from '@promoboxx/use-filter/dist/useSimpleFilter'
import { useMemo, useState } from 'react'

import {
  GetGameListQueryDocument,
  GetGameListQueryQuery,
  OpenGamesFolderDocument,
  SetRatingDocument,
} from '@src/graphql/operations'
import StarRating from '@src/lib/StarRating'
import { useRootDispatch } from '@src/redux/helpers'
import actions from '@src/sourcePorts/actions'

import calculateGamePlayTime from './calculateGamePlayTime'
import GameDialog from './GameDialog'

type ArrayItemType<T> = T extends Array<infer A> ? A : never

export type GameListGame = ArrayItemType<GetGameListQueryQuery['getGames']>

const GameList: React.FC = () => {
  const { data, refetch } = useSuspenseQuery(GetGameListQueryDocument)
  const dispatch = useRootDispatch()

  const [openGamesFolderMutation] = useMutation(OpenGamesFolderDocument)
  const [setRating] = useMutation(SetRatingDocument)
  const [selectedId, setSelectedId] = useState<GameListGame['id']>()

  const {
    debouncedFilterInfo,
    filterInfo,
    updateFilter,
    resetFilter,
    setSort,
  } = useSimpleFilter('GameList', {
    defaultFilterInfo: {
      filter: {
        name: '',
        rating: 0,
      },
      sort: 'name:asc',
    },
  })

  async function openGamesFolder(game_id?: string) {
    try {
      const response = await openGamesFolderMutation({
        variables: {
          game_id,
        },
      })

      if (!response.data?.openGamesFolder) {
        throw new Error('openGamesFolder returned false')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = useMemo(() => {
    const filtered = data.getGames.filter((x) => {
      let shouldInclude = true

      if (
        debouncedFilterInfo.filter.name &&
        !x.name
          .toLowerCase()
          .includes(debouncedFilterInfo.filter.name.toLowerCase())
      ) {
        shouldInclude &&= false
      }

      if (
        debouncedFilterInfo.filter.rating &&
        x.rating !== debouncedFilterInfo.filter.rating
      ) {
        shouldInclude &&= false
      }

      return shouldInclude
    })

    const [sortKey = 'name', sortDirection = 'asc'] =
      debouncedFilterInfo.sort?.split(':') || []

    filtered.sort((a, b) => {
      if (sortKey === 'name') {
        return a.name.localeCompare(b.name)
      }

      if (sortKey === 'rating') {
        return a.rating - b.rating
      }

      if (sortKey === 'lastPlayed') {
        const lastPlayedA = new Date(
          a.play_sessions[a.play_sessions.length - 1]?.ended_at || 0,
        )
        const lastPlayedB = new Date(
          b.play_sessions[b.play_sessions.length - 1]?.ended_at || 0,
        )

        return lastPlayedA.valueOf() - lastPlayedB.valueOf()
      }

      if (sortKey === 'playTime') {
        return (
          calculateGamePlayTime(a.play_sessions) -
          calculateGamePlayTime(b.play_sessions)
        )
      }

      return 0
    })

    if (sortDirection === 'desc') {
      filtered.reverse()
    }

    return filtered
  }, [
    data.getGames,
    debouncedFilterInfo.filter.name,
    debouncedFilterInfo.filter.rating,
    debouncedFilterInfo.sort,
  ])

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <Stack direction="row" spacing={1}>
            <Input
              size="small"
              margin="none"
              value={filterInfo.filter.name}
              placeholder="Filter ..."
              onChange={(event) => {
                updateFilter({ name: event.target.value })
              }}
              startAdornment={
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              }
            />

            <StarRating
              value={debouncedFilterInfo.filter.rating}
              onChange={(value) => {
                updateFilter({ rating: value }, true)
              }}
            />

            <Select
              variant="standard"
              size="small"
              margin="none"
              placeholder="Sort By ..."
              value={debouncedFilterInfo.sort}
              onChange={(event) => {
                setSort(event.target.value, true)
              }}
            >
              <MenuItem value="name:asc">Name</MenuItem>
              <MenuItem value="rating:desc">Rating</MenuItem>
              <MenuItem value="playTime:desc">Play Time</MenuItem>
              <MenuItem value="lastPlayed:desc">Last Played</MenuItem>
            </Select>

            <Button onClick={() => resetFilter(true)}>Reset</Button>
          </Stack>

          <Box flexGrow="1" />

          <Stack direction="row" spacing={1}>
            <Button
              onClick={() => {
                openGamesFolder()
              }}
              startIcon={<FolderOpen />}
            >
              Open Games Folder
            </Button>

            <Button
              onClick={() => {
                dispatch(actions.toggleDialog())
              }}
            >
              Source Ports
            </Button>

            <Button
              onClick={() => {
                refetch()
              }}
            >
              Reload
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <List disablePadding dense>
        {filtered.map((x) => {
          let playTime = calculateGamePlayTime(x.play_sessions)

          let playtimeMessage =
            playTime === 0
              ? 'Never played'
              : `${new Date(playTime * 1000)
                  .toISOString()
                  .substring(11, 19)} played`

          return (
            <ListItem key={x.id} disableGutters disablePadding divider>
              <ListItemButton
                disableRipple
                onClick={() => {
                  setSelectedId(x.id)
                }}
              >
                <ListItemText
                  primary={x.name}
                  secondary={
                    <>
                      {playtimeMessage} / {x.notes}
                    </>
                  }
                />
              </ListItemButton>

              <Stack direction="row" spacing={1} alignItems="center">
                <Stack direction="row" spacing={1}>
                  {x.tags.map((tag) => {
                    return (
                      <Chip
                        variant="outlined"
                        size="small"
                        key={tag}
                        label={tag}
                      />
                    )
                  })}
                </Stack>

                <StarRating
                  value={x.rating}
                  onChange={(value) => {
                    setRating({
                      variables: {
                        game_id: x.id,
                        rating: value,
                      },
                    })
                  }}
                />

                {/* <IconButton
                  onClick={() => {
                    startGame(x)
                  }}
                  size="small"
                >
                  <PlayArrow />
                </IconButton> */}

                <IconButton
                  onClick={() => {
                    openGamesFolder(x.id)
                  }}
                  size="small"
                >
                  <FolderOpen />
                </IconButton>
              </Stack>
            </ListItem>
          )
        })}
      </List>

      {selectedId ? (
        <GameDialog
          open={!!selectedId}
          gameId={selectedId}
          onClose={() => setSelectedId(undefined)}
        />
      ) : undefined}
    </>
  )
}

export default GameList
