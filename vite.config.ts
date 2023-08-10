import { defineConfig } from 'vite'
import { viteConfig, pluginOptions } from '@promoboxx/react-scripts-vite'

pluginOptions.checker = false
pluginOptions.pwa = false

export default defineConfig(async (env) => {
  const config = await viteConfig(env)

  return {
    ...config,
    plugins: [...config.plugins],
    server: {
      ...config.server,
      open: false,
    },
    build: {
      ...config.build,
    },
  }
})
