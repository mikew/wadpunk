import { ArrowDropDown, Search } from '@mui/icons-material'
import {
  Button,
  InputAdornment,
  ListItemIcon,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { SimpleFilterApi } from '@promoboxx/use-filter/dist/useSimpleFilter'

import StarRating from '#src/lib/StarRating'
import { EasyMenu, EasyMenuItem } from '#src/mui/EasyMenu'

export interface GameListFilter {
  name: string
  rating: number
  starRatingMode: 'at_least' | 'equal' | 'at_most'
}

const GameFilterToolbar: React.FC<{
  filterApi: SimpleFilterApi<GameListFilter>
}> = ({ filterApi }) => {
  return (
    <>
      <TextField
        size="small"
        margin="none"
        variant="standard"
        value={filterApi.filterInfo.filter.name}
        label="Filter ..."
        onChange={(event) => {
          filterApi.updateFilter({ name: event.target.value })
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
        sx={{ flex: '0 0 200px' }}
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
                {filterApi.filterInfo.filter.starRatingMode}{' '}
                <ArrowDropDown fontSize="inherit" />
              </Typography>
            )
          }}
          MenuListProps={{
            dense: true,
          }}
        >
          <EasyMenuItem
            selected={filterApi.filterInfo.filter.starRatingMode === 'at_most'}
            onClickDelayed={() => {
              filterApi.updateFilter({ starRatingMode: 'at_most' }, true)
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
            selected={filterApi.filterInfo.filter.starRatingMode === 'equal'}
            onClickDelayed={() => {
              filterApi.updateFilter({ starRatingMode: 'equal' }, true)
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
            selected={filterApi.filterInfo.filter.starRatingMode === 'at_least'}
            onClickDelayed={() => {
              filterApi.updateFilter({ starRatingMode: 'at_least' }, true)
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
          value={filterApi.debouncedFilterInfo.filter.rating}
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
        label="Sort By ..."
        value={filterApi.debouncedFilterInfo.sort}
        onChange={(event) => {
          filterApi.setSort(event.target.value, true)
        }}
        sx={{ flex: '0 0 200px' }}
      >
        <MenuItem value="name:asc">Name</MenuItem>
        <MenuItem value="rating:desc">Rating</MenuItem>
        <MenuItem value="playTime:desc">Play Time</MenuItem>
        <MenuItem value="lastPlayed:desc">Last Played</MenuItem>
        <MenuItem value="installedAt:desc">Date Installed</MenuItem>
      </TextField>

      <div>
        <Button
          size="small"
          onClick={() => {
            filterApi.resetFilter(true)
          }}
        >
          Clear
        </Button>
      </div>
    </>
  )
}

export default GameFilterToolbar
