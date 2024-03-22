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

export const EasyMenuItem: React.FC<EasyMenuItemProps> = (props) => {
  const context = useContext(EasyMenuContext)

  return (
    <MenuItem
      {...props}
      onClick={(event) => {
        if (props.onClickDelayed) {
          context.closeWithDelay(() => {
            props.onClickDelayed?.(event)
          })
        } else if (props.onClick) {
          props.onClick(event)
          context.closeImmediately()
        }
      }}
    >
      {props.children}
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
