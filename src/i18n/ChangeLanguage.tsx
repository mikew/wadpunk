import { ArrowDropDown } from '@mui/icons-material'
import { Box, Menu, MenuItem } from '@mui/material'
import { useState } from 'react'

import i18nConfig from './config'
import { useI18nContext } from './lib/i18nContext'

const ChangeLanguage: React.FC = () => {
  const { setLocale, locale, t } = useI18nContext()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <Box component="span" sx={{ cursor: 'pointer' }} onClick={handleClick}>
        {t(`languageSelector.languages.${locale.toLowerCase()}`)}
        <ArrowDropDown color="inherit" />
      </Box>

      <Menu
        open={open}
        onClose={handleClose}
        anchorEl={anchorEl}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'bottom',
        }}
        transformOrigin={{
          horizontal: 'right',
          vertical: 'top',
        }}
      >
        {i18nConfig.supportedLocales?.map((x) => {
          return (
            <MenuItem
              key={x}
              component="a"
              target="_blank"
              selected={locale === x}
              onClick={() => {
                setLocale(x)
                setAnchorEl(null)
              }}
            >
              {t(`languageSelector.languages.${x.toLowerCase()}`)}
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}

export default ChangeLanguage
