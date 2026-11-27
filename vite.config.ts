import { viteConfig, pluginOptions } from '@promoboxx/react-scripts-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'

pluginOptions.pwa = false
// pluginOptions.checker = false
pluginOptions.splitVendorChunkPlugin = false

export default defineConfig(async (env) => {
  if (env.isPreview) {
    pluginOptions.checker = false
  }

  const config = await viteConfig(env)

  delete config.build

  config.server = {
    ...config.server,
    open: false,
  }

  if (!process.env.VITEST) {
    config.plugins?.unshift(
      tanstackStart({
        spa: {
          enabled: true,
          prerender: {
            outputPath: '/index.html',
          },
        },
      }),
    )
  }

  return config
})
