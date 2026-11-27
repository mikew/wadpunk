import ArrowDropDown from '@mui/icons-material/ArrowDropDown'
import Language from '@mui/icons-material/Language'
import { ListItemIcon, ListItemText, MenuItem } from '@mui/material'

import { EasyMenu, EasyMenuItem } from '#src/mui/EasyMenu'

import i18nConfig from './config'
import { useI18nContext } from './lib/i18nContext'
import Translate from './Translate'

const ChangeLanguage: React.FC = () => {
  const { setLocale, locale } = useI18nContext()

  return (
    <EasyMenu
      renderTrigger={(props) => {
        return (
          <MenuItem {...props}>
            <ListItemIcon>
              <Language fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              <Translate
                scope={`languageSelector.languages.${locale.toLowerCase()}`}
              />
            </ListItemText>
            <ArrowDropDown color="inherit" />
          </MenuItem>
        )
      }}
      id="settings-menu"
      anchorOrigin={{
        horizontal: 'left',
        vertical: 'bottom',
      }}
      transformOrigin={{
        horizontal: 'left',
        vertical: 'top',
      }}
      slotProps={{
        list: { dense: true },
      }}
    >
      {i18nConfig.supportedLocales?.map((x) => {
        return (
          <EasyMenuItem
            key={x}
            selected={locale === x}
            onClickDelayed={() => {
              setLocale(x)
            }}
          >
            <Translate
              scope={`languageSelector.languages.${x.toLowerCase()}`}
            />
          </EasyMenuItem>
        )
      })}
    </EasyMenu>
  )
}

export default ChangeLanguage
