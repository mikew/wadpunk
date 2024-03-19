import { Alert } from '@mui/material'
import type { CustomContentProps } from 'notistack'
import { forwardRef } from 'react'

// Adapted from https://github.com/iamhosseindhv/notistack/blob/a61155adc85443f01dfc8818b6b6653edbd83288/src/ui/MaterialDesignContent/MaterialDesignContent.tsx
const NotistackMuiAlert = forwardRef<HTMLDivElement, CustomContentProps>(
  (props, forwardedRef) => {
    const {
      id,
      message,
      action: componentOrFunctionAction,
      variant: notistackVariant,
      hideIconVariant,
      style,
      className,
    } = props

    const severity = notistackVariant === 'default' ? 'info' : notistackVariant
    const action =
      typeof componentOrFunctionAction === 'function'
        ? componentOrFunctionAction(id)
        : componentOrFunctionAction

    return (
      <Alert
        ref={forwardedRef}
        severity={severity}
        icon={hideIconVariant ? false : undefined}
        action={action}
        style={style}
        className={className}
        variant="filled"
        sx={(theme) => ({
          boxShadow: theme.shadows[8],
        })}
      >
        {message}
      </Alert>
    )
  },
)

export default NotistackMuiAlert
