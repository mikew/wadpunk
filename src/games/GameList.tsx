import { useMutation, useSuspenseQuery } from '@apollo/client'
import FolderOpen from '@mui/icons-material/FolderOpen'
import PlayArrow from '@mui/icons-material/PlayArrow'
import {
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
} from '@mui/material'
import useSimpleFilter from '@promoboxx/use-filter/dist/useSimpleFilter'
import { enqueueSnackbar } from 'notistack'
import { useMemo, useState } from 'react'

import { AppToolbarPortal } from '#src/app/AppToolbarArea'
import * as games from '#src/games/redux'
import { invalidateApolloQuery } from '#src/graphql/graphqlClient'
import { useI18nContext } from '#src/i18n/lib/i18nContext'
import pathWithoutExtension from '#src/lib/pathWithoutExtension'
import StarRating from '#src/lib/StarRating'
import VirtualizedList from '#src/lib/VirtualizedList'
import { useRootDispatch } from '#src/redux/helpers'

import calculateGamePlayTime from './calculateGamePlayTime'
import type { GameListFilter } from './GameFilterToolbar'
import GameFilterToolbar from './GameFilterToolbar'
import {
  GetGameListQueryDocument,
  SetRatingDocument,
  StartGameDocument,
} from './operations.generated'
import useOpenGamesFolder from './useOpenGamesFolder'

const GameList: React.FC = () => {
  const { data } = useSuspenseQuery(GetGameListQueryDocument)
  const dispatch = useRootDispatch()

  const [setRating] = useMutation(SetRatingDocument)
  const [startGame] = useMutation(StartGameDocument)
  const { openGamesFolder } = useOpenGamesFolder()
  const { t } = useI18nContext()

  const filterApi = useSimpleFilter<GameListFilter>('GameList', {
    defaultFilterInfo: {
      filter: {
        name: '',
        rating: 0,
        starRatingMode: 'at_least',
        tags: [],
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

      if (debouncedFilterInfo.filter.tags.length) {
        let doesMatchTags = true

        for (const tag of debouncedFilterInfo.filter.tags) {
          if (!x.tags.includes(tag)) {
            doesMatchTags = false
            break
          }
        }

        shouldInclude &&= doesMatchTags
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
    debouncedFilterInfo.filter.tags,
    debouncedFilterInfo.sort,
  ])

  const [totalHeight, setTotalHeight] = useState<number>(0)

  return (
    <>
      <AppToolbarPortal portalKey="GameFilterToolbar">
        <GameFilterToolbar filterApi={filterApi} />
      </AppToolbarPortal>

      <List disablePadding dense component="div" sx={{ height: totalHeight }}>
        <VirtualizedList
          itemHeight={60}
          buffer={3}
          items={filtered}
          scrollElement={window}
          setContainerHeight={setTotalHeight}
          renderItem={(props) => {
            const x = props.item

            let playTime = calculateGamePlayTime(x.play_sessions)

            let playtimeMessage =
              playTime === 0
                ? 'Never played'
                : `${new Date(playTime * 1000)
                    .toISOString()
                    .substring(11, 19)} played`

            return (
              <ListItem
                key={x.id}
                disableGutters
                disablePadding
                divider
                style={props.style}
                component="div"
              >
                <ListItemButton
                  disableRipple
                  onClick={() => {
                    dispatch(games.actions.setSelectedId(x.id))
                  }}
                >
                  <ListItemText
                    primary={x.name}
                    primaryTypographyProps={{ noWrap: true }}
                    secondary={
                      <>
                        {playtimeMessage} / {x.notes}
                      </>
                    }
                    secondaryTypographyProps={{ noWrap: true }}
                  />

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

                    <IconButton
                      onClick={(event) => {
                        event.stopPropagation()
                        openGamesFolder(x.id)
                      }}
                      size="small"
                    >
                      <FolderOpen fontSize="small" />
                    </IconButton>

                    <IconButton
                      disabled={x.previous_file_state.length === 0}
                      onClick={async (event) => {
                        try {
                          event.stopPropagation()

                          const startGameResponse = await startGame({
                            variables: {
                              game_id: x.id,
                            },
                          })

                          invalidateApolloQuery(['getGames'])

                          if (!startGameResponse.data?.startGame) {
                            throw new Error('Error while running game')
                          }
                        } catch (err) {
                          console.error('Failed to start game:', err)

                          const message =
                            err instanceof Error ? err.message : 'Unknown error'
                          enqueueSnackbar(
                            `${t('games.notifications.startError')}: ${message}`,
                            {
                              variant: 'error',
                            },
                          )
                        }
                      }}
                      size="small"
                    >
                      <PlayArrow fontSize="small" />
                    </IconButton>
                  </Stack>
                </ListItemButton>
              </ListItem>
            )
          }}
        />
      </List>
    </>
  )
}

export default GameList
