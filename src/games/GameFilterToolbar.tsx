import { ArrowDropDown, Clear, Search } from '@mui/icons-material'
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
import type { SimpleFilterApi } from '@promoboxx/use-filter/dist/useSimpleFilter'

import { useI18nContext } from '#src/i18n/lib/i18nContext'
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
  const { t } = useI18nContext()
  const tags = useAllTags(true)

  return (
    <>
      <TextField
        size="small"
        margin="none"
        variant="standard"
        value={filterApi.filterInfo.filter.name}
        label={t('games.filter.fields.name.label')}
        onChange={(event) => {
          filterApi.updateFilter({ name: event.target.value })
        }}
        InputProps={{
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
                {t(
                  `games.filter.fields.starRatingMode.${filterApi.filterInfo.filter.starRatingMode}`,
                )}{' '}
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
            {t(`games.filter.fields.starRatingMode.at_most`)}
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
            {t(`games.filter.fields.starRatingMode.equal`)}
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
            {t(`games.filter.fields.starRatingMode.at_least`)}
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
        label={t('games.filter.fields.sort.label')}
        value={filterApi.debouncedFilterInfo.sort}
        onChange={(event) => {
          filterApi.setSort(event.target.value, true)
        }}
        sx={{ flex: '0 0 200px' }}
      >
        <MenuItem value="name:asc">{t('games.fields.name.label')}</MenuItem>
        <MenuItem value="rating:desc">
          {t('games.fields.rating.label')}
        </MenuItem>
        <MenuItem value="playTime:desc">
          {t('games.fields.playTime.label')}
        </MenuItem>
        <MenuItem value="lastPlayed:desc">
          {t('games.fields.lastPlayed.label')}
        </MenuItem>
        <MenuItem value="installedAt:desc">
          {t('games.fields.installed_at.label')}
        </MenuItem>
      </TextField>

      <TextField
        select
        SelectProps={{
          multiple: true,
        }}
        size="small"
        margin="none"
        variant="standard"
        label={t('games.filter.fields.tags.label')}
        value={filterApi.filterInfo.filter.tags}
        InputProps={{
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
        }}
        onChange={(event) => {
          if (!Array.isArray(event.target.value)) {
            return
          }

          filterApi.updateFilter({
            tags: event.target.value,
          })
        }}
        sx={{ flex: '0 0 200px' }}
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
          {t('shared.clear')}
        </Button>
      </div>
    </>
  )
}

export default GameFilterToolbar
