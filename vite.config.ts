import { viteConfig, pluginOptions } from '@promoboxx/react-scripts-vite'
import { defineConfig } from 'vite'

pluginOptions.pwa = false
pluginOptions.checker = {
  ...pluginOptions.checker,
  overlay: {
    initialIsOpen: false,
  },
}

export default defineConfig(async (env) => {
  const config = await viteConfig(env)

  return {
    ...config,
    plugins: [...config.plugins],
    server: {
      ...config.server,
      open: false,
    },
    resolve: {
      alias: {
        ...config.resolve?.alias,
        '@mui/material': '@mui/material/modern',
        '@mui/icons-material': '@mui/icons-material/esm',
        '@mui/joy': '@mui/joy/modern',
      },
    },
    build: {
      ...config.build,
    },
  }
})
