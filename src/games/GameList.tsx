import { useMutation, useSuspenseQuery } from '@apollo/client'
import {
  ArrowDropDown,
  ExitToApp,
  Refresh,
  Search,
  Settings,
  Terminal,
} from '@mui/icons-material'
import FolderOpen from '@mui/icons-material/FolderOpen'
import {
  AppBar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import useSimpleFilter from '@promoboxx/use-filter/dist/useSimpleFilter'
import { process } from '@tauri-apps/api'
import { enqueueSnackbar } from 'notistack'
import { useMemo, useState } from 'react'

import OnboardingAlerts from '#src/app/OnboardingAlerts'
import { invalidateApolloCache } from '#src/graphql/graphqlClient'
import type { GetGameListQueryQuery } from '#src/graphql/operations'
import {
  GetAppInfoDocument,
  GetGameListQueryDocument,
  OpenGamesFolderDocument,
  SetRatingDocument,
} from '#src/graphql/operations'
import pathWithoutExtension from '#src/lib/pathWithoutExtension'
import StarRating from '#src/lib/StarRating'
import { EasyMenu, EasyMenuItem } from '#src/mui/EasyMenu'
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
import type { GameListFilter } from './GameFilterToolbar'
import GameFilterToolbar from './GameFilterToolbar'
import useOpenGamesFolder from './useOpenGamesFolder'

const GameList: React.FC = () => {
  const { data } = useSuspenseQuery(GetGameListQueryDocument)
  const dispatch = useRootDispatch()

  const [setRating] = useMutation(SetRatingDocument)
  const [selectedId, setSelectedId] = useState<GameListGame['id']>()
  const { data: appInfoData } = useSuspenseQuery(GetAppInfoDocument)

  const filterApi = useSimpleFilter<GameListFilter>('GameList', {
    defaultFilterInfo: {
      filter: {
        name: '',
        rating: 0,
        starRatingMode: 'at_least',
      },
      sort: 'name:asc',
    },
  })

  const { debouncedFilterInfo } = filterApi

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
        return pathWithoutExtension(a.name).localeCompare(
          pathWithoutExtension(b.name),
        )
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

      if (sortKey === 'installedAt') {
        const valueA = new Date(a.installed_at)
        const valueB = new Date(b.installed_at)

        return valueA.valueOf() - valueB.valueOf()
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

      <OnboardingAlerts />
      <AppToolbarPortal portalKey="GameFilterToolbar">
        <GameFilterToolbar filterApi={filterApi} />
      </AppToolbarPortal>

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
