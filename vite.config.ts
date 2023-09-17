import { defineConfig } from 'vite'
import { viteConfig, pluginOptions } from '@promoboxx/react-scripts-vite'

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
    build: {
      ...config.build,
    },
  }
})
