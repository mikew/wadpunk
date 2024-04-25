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

    // rollupOptions: {
    //   output: {
    //     manualChunks: (id) => {
    //       if (
    //         id.includes('@mui') ||
    //         id.includes('notistack') ||
    //         id.includes('@popperjs') ||
    //         id.includes('@emotion')
    //       ) {
    //         return 'mui'
    //       }

    //       if (
    //         id.includes('@apollo') ||
    //         id.includes('optimism') ||
    //         id.includes('zen-observable')
    //       ) {
    //         return 'apollo'
    //       }

    //       if (id.includes('node_modules')) {
    //         return 'vendor'
    //       }
    //     },
    //     // manualChunks: {
    //     //   mui: ['@mui/material', '@mui/icons-material'],
    //     // },
    //   },
    // },
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
