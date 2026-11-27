import { Alert, AlertTitle, Box, Button } from '@mui/material'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { useEffect } from 'react'

import Translate from '#src/i18n/Translate'

const AppErrorComponent: React.FC<ErrorComponentProps> = ({ error, info }) => {
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
            <Translate scope="app.errorBoundary.reload" />
          </Button>
        }
      >
        <AlertTitle>
          <Translate scope="app.errorBoundary.title" />
        </AlertTitle>
        {error instanceof Error ? error.message : String(error)}
      </Alert>
    </Box>
  )
}

export default AppErrorComponent
