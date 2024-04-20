import { ArrowDropDown, Language } from '@mui/icons-material'
import { ListItemIcon, ListItemText, MenuItem } from '@mui/material'

import { EasyMenu, EasyMenuItem } from '#src/mui/EasyMenu'

import i18nConfig from './config'
import { useI18nContext } from './lib/i18nContext'

const ChangeLanguage: React.FC = () => {
  const { setLocale, locale, t } = useI18nContext()

  return (
    <EasyMenu
      renderTrigger={(props) => {
        return (
          <MenuItem {...props}>
            <ListItemIcon>
              <Language fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {t(`languageSelector.languages.${locale.toLowerCase()}`)}
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
      MenuListProps={{
        dense: true,
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
            {t(`languageSelector.languages.${x.toLowerCase()}`)}
          </EasyMenuItem>
        )
      })}
    </EasyMenu>
  )
}

export default ChangeLanguage
