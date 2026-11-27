import { useSuspenseQuery } from '@apollo/client/react'
import ExitToApp from '@mui/icons-material/ExitToApp'
import Extension from '@mui/icons-material/Extension'
import FolderOpen from '@mui/icons-material/FolderOpen'
import Refresh from '@mui/icons-material/Refresh'
import Settings from '@mui/icons-material/Settings'
import Terminal from '@mui/icons-material/Terminal'
import { Divider, IconButton, ListItemIcon, Typography } from '@mui/material'
import * as process from '@tauri-apps/plugin-process'

import useOpenGamesFolder from '#src/games/useOpenGamesFolder'
import useInvalidateApolloCache from '#src/graphql/useInvalidateApolloCache'
import ChangeLanguage from '#src/i18n/ChangeLanguage'
import Translate from '#src/i18n/Translate'
import modSetsActions from '#src/modSets/actions'
import { EasyMenu, EasyMenuItem } from '#src/mui/EasyMenu'
import { useRootDispatch } from '#src/redux/helpers'
import actions from '#src/sourcePorts/actions'

import { GetAppInfoDocument } from './operations.generated'

const AppCogMenu: React.FC = () => {
  const { openGamesFolder } = useOpenGamesFolder()
  const { invalidateApolloCache } = useInvalidateApolloCache()
  const dispatch = useRootDispatch()
  const { data: appInfoData } = useSuspenseQuery(GetAppInfoDocument)

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
      slotProps={{
        list: { dense: true },
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
        <Translate scope="sourcePorts.title" />
      </EasyMenuItem>

      <EasyMenuItem
        onClickDelayed={() => {
          dispatch(modSetsActions.toggleDialog())
        }}
      >
        <ListItemIcon>
          <Extension fontSize="small" />
        </ListItemIcon>
        <Translate scope="modSets.title" />
      </EasyMenuItem>

      <EasyMenuItem
        onClickDelayed={() => {
          openGamesFolder()
        }}
      >
        <ListItemIcon>
          <FolderOpen fontSize="small" />
        </ListItemIcon>
        <Translate scope="games.actions.openGamesFolder" />
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
        <Translate scope="app.actions.reload" />
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
        <Translate scope="app.actions.exit" />
      </EasyMenuItem>

      <Divider />

      <ChangeLanguage />

      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          textAlign: 'center',
        }}
      >
        <Translate
          scope="app.nameAndVersion"
          options={{
            name: appInfoData.getAppInfo.name,
            version: appInfoData.getAppInfo.version,
          }}
        />
      </Typography>
    </EasyMenu>
  )
}

export default AppCogMenu
