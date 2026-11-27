import { Alert, AlertTitle, Box, Button } from '@mui/material'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useI18nContext } from '#src/i18n/lib/i18nContext'

const AppErrorComponent: React.FC<ErrorComponentProps> = ({ error, info }) => {
  const { t } = useI18nContext()

  useEffect(() => {
    console.error('Unhandled UI error:', error, info?.componentStack)
  }, [error, info])

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

export default AppErrorComponent
