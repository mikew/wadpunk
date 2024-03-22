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
import { enqueueSnackbar } from 'notistack'
import { useMemo, useState } from 'react'

import { invalidateApolloQuery } from '#src/graphql/graphqlClient'
import type { GetGameListQueryQuery } from '#src/graphql/operations'
import {
  GetGameListQueryDocument,
  OpenGamesFolderDocument,
  SetRatingDocument,
} from '#src/graphql/operations'
import StarRating from '#src/lib/StarRating'
import { useRootDispatch } from '#src/redux/helpers'
import actions from '#src/sourcePorts/actions'

import calculateGamePlayTime from './calculateGamePlayTime'
import GameDialog from './GameDialog'

type ArrayItemType<T> = T extends Array<infer A> ? A : never

export type GameListGame = ArrayItemType<GetGameListQueryQuery['getGames']>

interface GameListFilter {
  name: string
  rating: number
  starRatingMode: 'at_least' | 'equal' | 'at_most'
}

const GameList: React.FC = () => {
  const { data } = useSuspenseQuery(GetGameListQueryDocument)
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
  } = useSimpleFilter<GameListFilter>('GameList', {
    defaultFilterInfo: {
      filter: {
        name: '',
        rating: 0,
        starRatingMode: 'at_least',
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
        enqueueSnackbar('Could not open folder', { variant: 'error' })
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

      if (debouncedFilterInfo.filter.rating) {
        switch (debouncedFilterInfo.filter.starRatingMode) {
          case 'at_most':
            shouldInclude &&= x.rating <= debouncedFilterInfo.filter.rating
            break
          case 'equal':
            shouldInclude &&= x.rating === debouncedFilterInfo.filter.rating
            break
          case 'at_least':
            shouldInclude &&= x.rating >= debouncedFilterInfo.filter.rating
            break
        }
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
    debouncedFilterInfo.filter.starRatingMode,
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

          <Stack direction="column">
            <EasyMenu
              id="filter-star-rating-mode"
              renderTrigger={(props) => {
                return (
                  <Typography
                    {...props}
                    variant="overline"
                    color="text.secondary"
                    sx={{ cursor: 'pointer', lineHeight: 'initial' }}
                  >
                    {filterInfo.filter.starRatingMode}{' '}
                    <ArrowDropDown fontSize="inherit" />
                  </Typography>
                )
              }}
              MenuListProps={{
                dense: true,
              }}
            >
              <EasyMenuItem
                selected={filterInfo.filter.starRatingMode === 'at_most'}
                onClickDelayed={() => {
                  updateFilter({ starRatingMode: 'at_most' }, true)
                }}
              >
                <ListItemIcon>
                  <Typography variant="body2" color="text.secondary">
                    &lt;=
                  </Typography>
                </ListItemIcon>
                At Most
              </EasyMenuItem>

              <EasyMenuItem
                selected={filterInfo.filter.starRatingMode === 'equal'}
                onClickDelayed={() => {
                  updateFilter({ starRatingMode: 'equal' }, true)
                }}
              >
                <ListItemIcon>
                  <Typography variant="body2" color="text.secondary">
                    =
                  </Typography>
                </ListItemIcon>
                Exactly
              </EasyMenuItem>

              <EasyMenuItem
                selected={filterInfo.filter.starRatingMode === 'at_least'}
                onClickDelayed={() => {
                  updateFilter({ starRatingMode: 'at_least' }, true)
                }}
              >
                <ListItemIcon>
                  <Typography variant="body2" color="text.secondary">
                    &gt;=
                  </Typography>
                </ListItemIcon>
                At Least
              </EasyMenuItem>
            </EasyMenu>

            <StarRating
              value={debouncedFilterInfo.filter.rating}
              onChange={(value) => {
                updateFilter({ rating: value }, true)
              }}
            />
          </Stack>

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

          <EasyMenu
            renderTrigger={(props) => {
              return (
                <IconButton {...props} edge="end">
                  <Settings />
                </IconButton>
              )
            }}
            id="settings-menu"
            anchorOrigin={{
              horizontal: 'right',
              vertical: 'bottom',
            }}
            transformOrigin={{
              horizontal: 'right',
              vertical: 'top',
            }}
            MenuListProps={{
              dense: true,
            }}
          >
            <EasyMenuItem
              onClickDelayed={() => {
                openGamesFolder()
              }}
            >
              Open Games Folder
            </EasyMenuItem>

            <EasyMenuItem
              onClickDelayed={() => {
                dispatch(actions.toggleDialog())
              }}
            >
              <ListItemIcon>
                <Terminal fontSize="small" />
              </ListItemIcon>
              Source Ports
            </EasyMenuItem>

            <EasyMenuItem
              onClickDelayed={() => {
                invalidateApolloQuery(['getGames'])
              }}
            >
              <ListItemIcon>
                <Refresh fontSize="small" />
              </ListItemIcon>
              Reload
            </EasyMenuItem>
          </EasyMenu>
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
