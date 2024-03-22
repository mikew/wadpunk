import type { MenuItemProps, MenuProps } from '@mui/material'
import { Menu, MenuItem, useTheme } from '@mui/material'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

export type EasyMenuProps = Omit<MenuProps, 'open' | 'anchorEl' | 'onClose'> & {
  renderTrigger: (props: {
    'onClick': (event: React.MouseEvent<HTMLElement>) => void
    'aria-haspopup': 'listbox'
    'aria-controls': string
    'aria-expanded'?: 'true'
    'id'?: string
  }) => React.ReactNode
}

export const EasyMenu: React.FC<EasyMenuProps> = ({
  renderTrigger,
  ...MenuProps
}) => {
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const closeImmediately = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const closeWithDelay = useCallback(
    (fn?: () => void) => {
      setTimeout(() => {
        fn?.()
        setAnchorEl(null)
      }, theme.transitions.duration.leavingScreen)
    },
    [theme.transitions.duration.leavingScreen],
  )

  const contextValue = useMemo(() => {
    const value: EasyMenuContextValue = {
      closeImmediately,
      closeWithDelay,
    }

    return value
  }, [closeImmediately, closeWithDelay])

  return (
    <>
      <EasyMenuContext.Provider value={contextValue}>
        {renderTrigger({
          'onClick': (event) => {
            setAnchorEl(event.currentTarget)
          },
          'aria-haspopup': 'listbox',
          'aria-controls': `${MenuProps.id}-menu`,
          'aria-expanded': open ? 'true' : undefined,
          'id': `${MenuProps.id}-button`,
        })}
        <Menu
          {...MenuProps}
          id={`${MenuProps.id}-menu`}
          anchorEl={anchorEl}
          open={open}
          onClose={closeImmediately}
          MenuListProps={{
            'aria-labelledby': `${MenuProps.id}-button`,
            'role': 'listbox',
            ...MenuProps.MenuListProps,
          }}
        >
          {MenuProps.children}
        </Menu>
      </EasyMenuContext.Provider>
    </>
  )
}

export type EasyMenuItemProps = MenuItemProps & {
  onClickDelayed?: (event: React.MouseEvent<HTMLElement>) => void
}

export const EasyMenuItem: React.FC<EasyMenuItemProps> = ({
  onClickDelayed,
  ...MenuItemProps
}) => {
  const context = useContext(EasyMenuContext)

  return (
    <MenuItem
      {...MenuItemProps}
      onClick={(event) => {
        if (onClickDelayed) {
          context.closeWithDelay(() => {
            onClickDelayed(event)
          })
        } else if (MenuItemProps.onClick) {
          MenuItemProps.onClick(event)
          context.closeImmediately()
        }
      }}
    >
      {MenuItemProps.children}
    </MenuItem>
  )
}

export interface EasyMenuContextValue {
  closeImmediately: () => void
  closeWithDelay: (fn?: () => void) => void
}

export const EasyMenuContext = createContext<EasyMenuContextValue>({
  closeImmediately: () => {},
  closeWithDelay: () => {},
})
