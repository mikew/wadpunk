import { Alert, AlertTitle, Box, Button } from '@mui/material'
import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

import { useI18nContext } from '#src/i18n/lib/i18nContext'

const RootErrorFallback: React.FC<{ error: unknown }> = ({ error }) => {
  const { t } = useI18nContext()

  return (
    <Box sx={{ padding: 4 }}>
      <Alert
        severity="error"
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => {
              window.location.reload()
            }}
          >
            {t('app.errorBoundary.reload')}
          </Button>
        }
      >
        <AlertTitle>{t('app.errorBoundary.title')}</AlertTitle>
        {error instanceof Error ? error.message : String(error)}
      </Alert>
    </Box>
  )
}

class RootErrorBoundary extends Component<
  { children: ReactNode },
  { error: unknown; hasError: boolean }
> {
  state: { error: unknown; hasError: boolean } = {
    error: null,
    hasError: false,
  }

  static getDerivedStateFromError(error: unknown) {
    return { error, hasError: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return <RootErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}

export default RootErrorBoundary
