import { useSuspenseQuery } from '@apollo/client'
import {
  ExitToApp,
  FolderOpen,
  Refresh,
  Settings,
  Terminal,
} from '@mui/icons-material'
import { Divider, IconButton, ListItemIcon, Typography } from '@mui/material'
import { process } from '@tauri-apps/api'

import useOpenGamesFolder from '#src/games/useOpenGamesFolder'
import { invalidateApolloCache } from '#src/graphql/graphqlClient'
import ChangeLanguage from '#src/i18n/ChangeLanguage'
import { useI18nContext } from '#src/i18n/lib/i18nContext'
import { EasyMenu, EasyMenuItem } from '#src/mui/EasyMenu'
import { useRootDispatch } from '#src/redux/helpers'
import actions from '#src/sourcePorts/actions'

import { GetAppInfoDocument } from './operations.generated'

const AppCogMenu: React.FC = () => {
  const { openGamesFolder } = useOpenGamesFolder()
  const dispatch = useRootDispatch()
  const { data: appInfoData } = useSuspenseQuery(GetAppInfoDocument)
  const { t } = useI18nContext()

  return (
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
          dispatch(actions.toggleDialog())
        }}
      >
        <ListItemIcon>
          <Terminal fontSize="small" />
        </ListItemIcon>
        {t('sourcePorts.title')}
      </EasyMenuItem>

      <EasyMenuItem
        onClickDelayed={() => {
          openGamesFolder()
        }}
      >
        <ListItemIcon>
          <FolderOpen fontSize="small" />
        </ListItemIcon>
        {t('games.actions.openGamesFolder')}
      </EasyMenuItem>

      <Divider />

      <EasyMenuItem
        onClickDelayed={() => {
          invalidateApolloCache()
        }}
      >
        <ListItemIcon>
          <Refresh fontSize="small" />
        </ListItemIcon>
        {t('app.actions.reload')}
      </EasyMenuItem>

      <Divider />

      <EasyMenuItem
        onClickDelayed={() => {
          process.exit(0)
        }}
      >
        <ListItemIcon>
          <ExitToApp fontSize="small" />
        </ListItemIcon>
        {t('app.actions.exit')}
      </EasyMenuItem>

      <Divider />

      <ChangeLanguage />

      <Typography color="text.secondary" variant="body2" textAlign="center">
        {t('app.nameAndVersion', {
          name: appInfoData.getAppInfo.name,
          version: appInfoData.getAppInfo.version,
        })}
      </Typography>
    </EasyMenu>
  )
}

export default AppCogMenu
