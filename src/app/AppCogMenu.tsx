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
import { GetAppInfoDocument } from '#src/graphql/operations'
import { EasyMenu, EasyMenuItem } from '#src/mui/EasyMenu'
import { useRootDispatch } from '#src/redux/helpers'
import actions from '#src/sourcePorts/actions'

const AppCogMenu: React.FC = () => {
  const { openGamesFolder } = useOpenGamesFolder()
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
        Source Ports
      </EasyMenuItem>

      <EasyMenuItem
        onClickDelayed={() => {
          openGamesFolder()
        }}
      >
        <ListItemIcon>
          <FolderOpen fontSize="small" />
        </ListItemIcon>
        Open Games Folder
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
        Reload
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
        Exit
      </EasyMenuItem>

      <Divider />

      <Typography color="text.secondary" variant="body2" textAlign="center">
        {appInfoData.getAppInfo.name} v{appInfoData.getAppInfo.version}
      </Typography>
    </EasyMenu>
  )
}

export default AppCogMenu
