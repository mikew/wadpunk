import ArrowDropDown from '@mui/icons-material/ArrowDropDown'
import Clear from '@mui/icons-material/Clear'
import Search from '@mui/icons-material/Search'
import {
  Button,
  IconButton,
  InputAdornment,
  ListItemIcon,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { SimpleFilterApi } from '@promoboxx/use-filter/useSimpleFilter'

import Translate from '#src/i18n/Translate'
import StarRating from '#src/lib/StarRating'
import { EasyMenu, EasyMenuItem } from '#src/mui/EasyMenu'

import useAllTags from './useAllTags'

export interface GameListFilter {
  name: string
  rating: number
  starRatingMode: 'at_least' | 'equal' | 'at_most'
  tags: string[]
}

const GameFilterToolbar: React.FC<{
  filterApi: SimpleFilterApi<GameListFilter>
}> = ({ filterApi }) => {
  const tags = useAllTags(true)

  return (
    <>
      <TextField
        size="small"
        margin="none"
        variant="standard"
        value={filterApi.filterInfo.filter.name}
        label={<Translate scope="games.filter.fields.name.label" />}
        onChange={(event) => {
          filterApi.updateFilter({ name: event.target.value })
        }}
        sx={{ flex: '0 0 200px' }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: filterApi.filterInfo.filter.name ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => {
                    filterApi.updateFilter(
                      {
                        name: '',
                      },
                      true,
                    )
                  }}
                >
                  <Clear fontSize="inherit" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          },
        }}
      />

      <Stack direction="column">
        <EasyMenu
          id="filter-star-rating-mode"
          renderTrigger={(props) => {
            return (
              <Typography
                {...props}
                variant="overline"
                sx={{
                  color: 'text.secondary',
                  cursor: 'pointer',
                  lineHeight: 'initial',
                }}
              >
                <Translate
                  scope={`games.filter.fields.starRatingMode.${filterApi.filterInfo.filter.starRatingMode}`}
                />{' '}
                <ArrowDropDown fontSize="inherit" />
              </Typography>
            )
          }}
          slotProps={{
            list: { dense: true },
          }}
        >
          <EasyMenuItem
            selected={filterApi.filterInfo.filter.starRatingMode === 'at_most'}
            onClickDelayed={() => {
              filterApi.updateFilter({ starRatingMode: 'at_most' }, true)
            }}
          >
            <ListItemIcon>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                }}
              >
                &lt;=
              </Typography>
            </ListItemIcon>
            <Translate scope="games.filter.fields.starRatingMode.at_most" />
          </EasyMenuItem>

          <EasyMenuItem
            selected={filterApi.filterInfo.filter.starRatingMode === 'equal'}
            onClickDelayed={() => {
              filterApi.updateFilter({ starRatingMode: 'equal' }, true)
            }}
          >
            <ListItemIcon>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                }}
              >
                =
              </Typography>
            </ListItemIcon>
            <Translate scope="games.filter.fields.starRatingMode.equal" />
          </EasyMenuItem>

          <EasyMenuItem
            selected={filterApi.filterInfo.filter.starRatingMode === 'at_least'}
            onClickDelayed={() => {
              filterApi.updateFilter({ starRatingMode: 'at_least' }, true)
            }}
          >
            <ListItemIcon>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                }}
              >
                &gt;=
              </Typography>
            </ListItemIcon>
            <Translate scope="games.filter.fields.starRatingMode.at_least" />
          </EasyMenuItem>
        </EasyMenu>

        <StarRating
          value={filterApi.filterInfo.filter.rating}
          onChange={(value) => {
            filterApi.updateFilter({ rating: value }, true)
          }}
        />
      </Stack>

      <TextField
        select
        size="small"
        margin="none"
        variant="standard"
        label={<Translate scope="games.filter.fields.sort.label" />}
        value={filterApi.filterInfo.sort}
        onChange={(event) => {
          filterApi.setSort(event.target.value, true)
        }}
        sx={{ flex: '0 0 200px' }}
      >
        <MenuItem value="name:asc">
          <Translate scope="games.fields.name.label" />
        </MenuItem>
        <MenuItem value="rating:desc">
          <Translate scope="games.fields.rating.label" />
        </MenuItem>
        <MenuItem value="playTime:desc">
          <Translate scope="games.fields.playTime.label" />
        </MenuItem>
        <MenuItem value="lastPlayed:desc">
          <Translate scope="games.fields.lastPlayed.label" />
        </MenuItem>
        <MenuItem value="installedAt:desc">
          <Translate scope="games.fields.installed_at.label" />
        </MenuItem>
      </TextField>

      <TextField
        select
        size="small"
        margin="none"
        variant="standard"
        label={<Translate scope="games.filter.fields.tags.label" />}
        value={filterApi.filterInfo.filter.tags}
        onChange={(event) => {
          if (!Array.isArray(event.target.value)) {
            return
          }

          filterApi.updateFilter({
            tags: event.target.value,
          })
        }}
        sx={{ flex: '0 0 200px' }}
        slotProps={{
          input: {
            endAdornment: filterApi.filterInfo.filter.tags.length ? (
              <InputAdornment position="end" sx={{ marginRight: 3 }}>
                <IconButton
                  size="small"
                  onClick={() => {
                    filterApi.updateFilter(
                      {
                        tags: [],
                      },
                      true,
                    )
                  }}
                >
                  <Clear fontSize="inherit" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          },

          select: {
            multiple: true,
          },
        }}
      >
        {tags.map((x) => {
          return (
            <MenuItem key={x} value={x}>
              {x}
            </MenuItem>
          )
        })}
      </TextField>

      <div>
        <Button
          size="small"
          onClick={() => {
            filterApi.resetFilter(true)
          }}
        >
          <Translate scope="shared.clear" />
        </Button>
      </div>
    </>
  )
}

export default GameFilterToolbar
