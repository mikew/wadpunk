import { viteConfig, pluginOptions } from '@promoboxx/react-scripts-vite'
import muteWarnings from '@promoboxx/react-scripts-vite/muteWarnings'
import { defineConfig } from 'vite'

pluginOptions.pwa = false
// pluginOptions.checker = false

export default defineConfig(async (env) => {
  const config = await viteConfig(env)

  config.build = {
    ...config.build,
    sourcemap: false,
  }

  config.plugins?.unshift(
    muteWarnings({
      warningsToIgnore: [
        [
          'SOURCEMAP_ERROR',
          'Error when using sourcemap for reporting an error:',
        ],
      ],
    }),
  )

  config.server = {
    ...config.server,
    open: false,
  }

  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve?.alias,
      '@mui/material': '@mui/material/modern',
      '@mui/icons-material': '@mui/icons-material/esm',
      '@mui/joy': '@mui/joy/modern',
    },
  }

  return config
})
