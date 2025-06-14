import { viteConfig, pluginOptions } from '@promoboxx/react-scripts-vite'
import { defineConfig } from 'vite'

pluginOptions.pwa = false
// pluginOptions.checker = false

export default defineConfig(async (env) => {
  const config = await viteConfig(env)

  config.build = {
    ...config.build,
    sourcemap: false,
  }

  config.server = {
    ...config.server,
    open: false,
  }

  return config
})
